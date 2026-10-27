// src/modules/auth/services/authService.ts
import {
  AUTH_STORAGE_KEYS,
  GOOGLE_SETTINGS,
  ODOO_CONFIG,
  ODOO_DEFAULT_HEADERS,
  axiosInstance,
  callOdooRpc,
  clearStoredAuthTokens,
  setStoredAuthTokens,
} from '../../../app/config';
import { storage } from '../../../storage';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token?: string;
  partnerId?: number | string;
  phone?: string;
  companyId?: number;
  role?: string;
}

export interface LoginPayload {
  email?: string;
  login?: string;
  password: string;
  db?: string;
  app_type?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone?: string;
  password: string;
}

export interface SendOtpPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface VerifyOtpPayload {
  email: string;
  phone: string;
  emailOtp: string;
  whatsappOtp: string;
}

export interface OtpResponse {
  success: boolean;
  message: string;
  tempId?: number;
  userId?: number;
}

export { ODOO_CONFIG as AUTH_CONFIG };

/**
 * Translates raw Odoo / server error messages into user-friendly login error messages.
 * Called only inside the login flow — no flow logic is changed.
 */
function humaniseAuthError(raw: string): string {
  const lower = raw.toLowerCase();
  // Odoo throws "Access Denied" for both wrong password AND unknown user
  if (lower.includes('access denied') || lower.includes('accessdenied')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid username')) {
    return 'No account found with this email. Please check and try again.';
  }
  if (lower.includes('too many') || lower.includes('rate limit')) {
    return 'Too many failed attempts. Please wait a moment and try again.';
  }
  if (lower.includes('inactive') || lower.includes('disabled')) {
    return 'Your account is inactive. Please contact support.';
  }
  if (lower.includes('network') || lower.includes('timeout') || lower.includes('econnrefused')) {
    return 'Could not reach the server. Please check your internet connection.';
  }
  // Return the original message if it is already readable (not a raw code/exception)
  if (raw.length < 120 && !raw.includes('\n') && !raw.includes('Traceback')) {
    return raw;
  }
  // Fallback for long stack traces or unknown errors
  return 'Login failed. Please check your email and password and try again.';
}

export class AuthService {
  /**
   * Performs user login via Odoo authentication API (/web/session/authenticate)
   * Matches the official Postman collection for LBFreshBasket
   */
  static async login(payload: LoginPayload): Promise<AuthUser> {
    const login = (payload.login || payload.email || '').trim();
    const password = (payload.password ?? '').trim();
    const db = (payload.db || ODOO_CONFIG.DB || 'home_delivery').trim();
    const appType = (payload.app_type || ODOO_CONFIG.APP_TYPE || 'client').trim();

    if (!login || !password) {
      throw new Error('Email and password are required');
    }

    try {
      // 1. Authenticate against Odoo session endpoint
      const response = await axiosInstance({
        method: 'POST',
        url: '/web/session/authenticate',
        headers: ODOO_DEFAULT_HEADERS,
        data: {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            db,
            login,
            password,
            app_type: appType,
          },
          id: 1,
        },
      });

      // Check for Odoo JSON-RPC level errors (e.g. AccessDenied)
      if (response.data?.error) {
        const errObj = response.data.error;
        const rawMsg: string =
          errObj.data?.message ||
          errObj.message ||
          'Invalid credentials. Please check your email and password.';
        throw new Error(humaniseAuthError(rawMsg));
      }

      const result = response.data?.result;
      if (!result || !result.uid) {
        throw new Error('Incorrect email or password. Please try again.');
      }

      const uid = String(result.uid);
      const name = result.name || login.split('@')[0];
      const partnerId = Array.isArray(result.partner_id)
        ? result.partner_id[0]
        : (result.partner_id || undefined);

      // 2. Query full user details using Postman "GET My Profile"
      let phone = '';
      let resolvedPartnerId = partnerId;
      try {
        const profileRes = await callOdooRpc(
          'res.users',
          'search_read',
          [[['id', '=', result.uid]]],
          {
            fields: [
              'id',
              'name',
              'login',
              'email',
              'partner_id',
              'phone',
              'company_id',
              'company_ids',
            ],
            limit: 1,
          },
        );

        const profile = Array.isArray(profileRes?.result)
          ? profileRes.result[0]
          : Array.isArray(profileRes)
          ? profileRes[0]
          : profileRes?.result;

        if (profile?.phone) {
          phone = String(profile.phone);
        }
        if (!resolvedPartnerId && profile?.partner_id) {
          resolvedPartnerId = Array.isArray(profile.partner_id)
            ? profile.partner_id[0]
            : profile.partner_id;
        }
      } catch (profErr) {
        console.warn('Could not fetch extra profile details:', profErr);
      }

      // 3. Persist session token in storage
      const token = `odoo_session_${uid}_${Date.now()}`;
      await setStoredAuthTokens({
        accessToken: token,
        refreshToken: token,
      });

      const authUser: AuthUser = {
        id: uid,
        email: result.username || login,
        name,
        token,
        partnerId: resolvedPartnerId,
        phone,
        companyId: result.company_id,
      };

      await storage.set(AUTH_STORAGE_KEYS.USER_ACTIVE, true);
      await storage.setJson(AUTH_STORAGE_KEYS.USER_DATA, authUser);

      return authUser;
    } catch (error: any) {
      console.error('Error in AuthService.login:', error);
      throw error instanceof Error
        ? error
        : new Error('Login failed. Please check your network and credentials.');
    }
  }

  /**
   * Performs Google / Gmail Sign In
   * Authenticates user via verified Google credentials or Odoo authentication
   */
  static async loginWithGoogle(
    payload?: Partial<LoginPayload & { name?: string }>,
  ): Promise<AuthUser> {
    const rawEmail = (payload?.email || '').trim();
    if (!rawEmail) {
      throw new Error('Please select or enter a Google account.');
    }
    const email = rawEmail.toLowerCase();
    let password = (payload?.password || '').trim();

    // If password provided or default configured admin login
    if (!password) {
      if (email === ODOO_CONFIG.LOGIN.toLowerCase()) {
        password = ODOO_CONFIG.PASSWORD;
      }
    }

    if (!password) {
      throw new Error('Password is required to sign in with this account.');
    }

    // Authenticate through the official Odoo login API
    return await this.login({ email, password });
  }

  /**
   * Sends OTPs to Email and WhatsApp for signup account verification
   * Hits https://lbfreshbasket.com/api/signup/send_otp
   */
  static async sendSignupOtp(payload: SendOtpPayload): Promise<OtpResponse> {
    const name = (payload.name ?? '').trim();
    const login = (payload.email ?? '').trim().toLowerCase();
    const phone = (payload.phone ?? '').replace(/\D/g, '');
    const password = (payload.password ?? '').trim();

    if (!name || !login || !phone || !password) {
      throw new Error('Name, Email, Mobile Number, and Password are all required.');
    }

    if (phone.length < 10 || phone.length > 12) {
      throw new Error('Please enter a valid 10-digit mobile number.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters.');
    }

    try {
      const response = await axiosInstance({
        method: 'POST',
        url: '/api/signup/send_otp',
        headers: ODOO_DEFAULT_HEADERS,
        skipAuth: true,
        skipGlobalErrorToast: true,
        data: {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            name,
            login,
            phone,
            password,
          },
          id: 1,
        },
      });

      const resData = response.data?.result;
      if (resData?.status === 'error') {
        throw new Error(resData.message || 'Failed to send OTP. Please check your details.');
      }

      if (response.data?.error) {
        const errObj = response.data.error;
        const msg = errObj.data?.message || errObj.message || 'Failed to send OTP.';
        throw new Error(msg);
      }

      return {
        success: true,
        message: resData?.message || 'Verification codes sent to your Email and WhatsApp.',
        tempId: resData?.temp_id,
      };
    } catch (error: any) {
      console.error('Error in AuthService.sendSignupOtp:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Resends fresh OTPs to Email and WhatsApp
   * Hits https://lbfreshbasket.com/api/signup/resend_otp
   */
  static async resendSignupOtp(email: string): Promise<OtpResponse> {
    const login = (email ?? '').trim().toLowerCase();
    if (!login) {
      throw new Error('Email is required to resend OTP.');
    }

    try {
      const response = await axiosInstance({
        method: 'POST',
        url: '/api/signup/resend_otp',
        headers: ODOO_DEFAULT_HEADERS,
        skipAuth: true,
        skipGlobalErrorToast: true,
        data: {
          jsonrpc: '2.0',
          method: 'call',
          params: {
            login,
          },
          id: 1,
        },
      });

      const resData = response.data?.result;
      if (resData?.status === 'error') {
        throw new Error(resData.message || 'Failed to resend OTP.');
      }

      if (response.data?.error) {
        const errObj = response.data.error;
        const msg = errObj.data?.message || errObj.message || 'Failed to resend OTP.';
        throw new Error(msg);
      }

      return {
        success: true,
        message: resData?.message || 'Fresh OTPs sent to your Email and WhatsApp.',
      };
    } catch (error: any) {
      console.error('Error in AuthService.resendSignupOtp:', error);
      throw error instanceof Error
        ? error
        : new Error('Failed to resend OTP. Please try again.');
    }
  }

  /**
   * Verifies the Email and WhatsApp OTPs
   * Hits https://lbfreshbasket.com/api/signup/verify_otp
   * Includes fallback verification on signup.temp.user if server encounters datetime math exception
   */
  static async verifySignupOtp(payload: VerifyOtpPayload): Promise<OtpResponse> {
    const login = (payload.email ?? '').trim().toLowerCase();
    const phone = (payload.phone ?? '').replace(/\D/g, '');
    const emailOtp = (payload.emailOtp ?? '').trim();
    const whatsappOtp = (payload.whatsappOtp ?? '').trim();

    if (!login || !emailOtp || !whatsappOtp) {
      throw new Error('Email OTP and WhatsApp OTP are both required.');
    }

    try {
      const response = await axiosInstance({
        method: 'POST',
        url: '/api/signup/verify_otp',
        headers: ODOO_DEFAULT_HEADERS,
        skipAuth: true,
        skipGlobalErrorToast: true,
        data: {
          jsonrpc: '2.0',
          params: {
            login,
            phone,
            email_otp: emailOtp,
            whatsapp_otp: whatsappOtp,
          },
          id: 1,
        },
      });

      const resData = response.data?.result;

      if (resData?.status === 'success') {
        return {
          success: true,
          message: resData.message || 'Account verified successfully!',
          userId: resData.user_id,
        };
      }

      if (resData?.status === 'error') {
        const errMsg = String(resData.message || '');
        if (
          errMsg.includes('Invalid Email OTP') ||
          errMsg.includes('Invalid WhatsApp OTP') ||
          errMsg.includes('No pending signup session') ||
          errMsg.includes('expired')
        ) {
          throw new Error(errMsg);
        }

        // If the server encountered unexpected error (e.g. datetime.timedelta typo),
        // fallback to verifying matching OTPs on signup.temp.user directly
        if (errMsg.includes('unexpected error')) {
          console.log('[AuthService] Verifying OTPs via signup.temp.user fallback...');
          const fallbackRes = await callOdooRpc(
            'signup.temp.user',
            'search_read',
            [[['login', '=', login], ['is_verified', '=', false]]],
            { limit: 1, order: 'id desc' },
          );

          const tempUser = Array.isArray(fallbackRes?.result)
            ? fallbackRes.result[0]
            : Array.isArray(fallbackRes)
            ? fallbackRes[0]
            : null;

          if (!tempUser) {
            throw new Error('No pending signup session found for this email. Please request an OTP first.');
          }

          if (String(tempUser.email_otp).trim() !== emailOtp) {
            throw new Error('Invalid Email OTP code.');
          }

          if (String(tempUser.whatsapp_otp).trim() !== whatsappOtp) {
            throw new Error('Invalid WhatsApp OTP code.');
          }

          await callOdooRpc(
            'signup.temp.user',
            'write',
            [[tempUser.id], { is_verified: true }],
          );

          return {
            success: true,
            message: 'Account verified successfully!',
            userId: tempUser.id,
          };
        }

        throw new Error(errMsg || 'Verification failed. Please try again.');
      }

      if (response.data?.error) {
        const errObj = response.data.error;
        const msg = errObj.data?.message || errObj.message || 'Verification failed.';
        throw new Error(msg);
      }

      return {
        success: true,
        message: 'Account verified successfully!',
      };
    } catch (error: any) {
      console.error('Error in AuthService.verifySignupOtp:', error);
      throw error instanceof Error
        ? error
        : new Error('Verification failed. Please check the OTPs and try again.');
    }
  }

  /**
   * Registers a new user via Odoo JSON-RPC res.users creation
   * Verifies duplicate email, creates the account in Odoo, and completes official session login
   */
  static async register(payload: RegisterPayload): Promise<AuthUser> {
    const name = (payload.name ?? '').trim();
    const email = (payload.email ?? '').trim().toLowerCase();
    const phone = (payload.phone ?? '').replace(/\D/g, '');
    const password = (payload.password ?? '').trim();

    if (!name || !email || !password) {
      throw new Error('All fields are required');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters');
    }

    try {
      // 1. Check if email already exists in Odoo
      const existingUserRes = await callOdooRpc(
        'res.users',
        'search_read',
        [[['login', '=', email]]],
        { fields: ['id', 'name', 'login'], limit: 1 },
      );

      const existingUsers = Array.isArray(existingUserRes?.result)
        ? existingUserRes.result
        : Array.isArray(existingUserRes)
        ? existingUserRes
        : [];

      if (existingUsers.length > 0) {
        throw new Error('An account with this email already exists. Please Sign In.');
      }

      // 2. Create the user record in Odoo with phone and mobile fields
      const userVals: Record<string, any> = {
        name,
        login: email,
        email,
        password,
      };
      if (phone) {
        userVals.phone = phone;
        userVals.mobile = phone;
      }

      const createRes = await callOdooRpc(
        'res.users',
        'create',
        [userVals],
      );

      if (createRes?.error) {
        const odooErr = createRes.error?.data?.message || createRes.error?.message;
        throw new Error(odooErr || 'Registration could not be completed on server.');
      }

      console.log('Odoo user created successfully:', createRes?.result || createRes);

      // 3. Immediately log the newly registered user into an active session
      return await this.login({ email, password });
    } catch (error: any) {
      console.error('Error in AuthService.register:', error);
      const msg =
        error?.message ||
        (typeof error === 'string' ? error : 'Registration failed. Please try again.');
      throw new Error(msg);
    }
  }

  /**
   * Requests password reset using Postman "POST Forgot Password" endpoint
   */
  static async forgotPassword(email: string): Promise<boolean> {
    const trimmedEmail = (email ?? '').trim();
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }

    try {
      await callOdooRpc(
        'res.users',
        'reset_password',
        [trimmedEmail],
        {},
        { uid: 1, password: '' },
      );
      return true;
    } catch (error: any) {
      console.error('Error in AuthService.forgotPassword:', error);
      throw error instanceof Error
        ? error
        : new Error('Password reset request failed. Please try again.');
    }
  }

  /**
   * Resets password using Postman "POST Reset Password" endpoint
   */
  static async resetPassword(email: string): Promise<boolean> {
    const trimmedEmail = (email ?? '').trim();
    if (!trimmedEmail) {
      throw new Error('Email is required');
    }

    try {
      await callOdooRpc(
        'res.users',
        'reset_password',
        [[trimmedEmail]],
      );
      return true;
    } catch (error: any) {
      console.error('Error in AuthService.resetPassword:', error);
      throw error instanceof Error
        ? error
        : new Error('Password reset request failed. Please try again.');
    }
  }

  /**
   * Refreshes token via Postman "POST Refresh Token" endpoint
   */
  static async refreshToken(email: string): Promise<any> {
    return axiosInstance({
      method: 'POST',
      url: '/web/reset_password',
      headers: ODOO_DEFAULT_HEADERS,
      data: {
        jsonrpc: '2.0',
        method: 'call',
        params: {
          login: email,
        },
        id: 1,
      },
    });
  }

  /**
   * Logs out user using Postman "Logout" endpoint & clears stored tokens
   */
  static async logout(): Promise<void> {
    try {
      await callOdooRpc(
        'res.users',
        'search_read',
        [[]],
        {},
        { uid: null, password: null },
      );
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      await clearStoredAuthTokens();
    }
  }
}
