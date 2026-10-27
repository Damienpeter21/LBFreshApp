import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { GOOGLE_SETTINGS } from '../../../app/config';
import { showErrorToast, showSuccessToast } from '../../../components/common/toast';
import { useTheme } from '../../../theme';
import { AuthButton } from '../components/AuthButton';
import { AuthInput } from '../components/AuthInput';
import { AuthLogo } from '../components/AuthLogo';
import { GoogleAccountPickerModal } from '../components/GoogleAccountPickerModal';
import { GoogleSignInButton } from '../components/GoogleSignInButton';
import { OtpVerificationModal } from '../components/OtpVerificationModal';
import { useAuth } from '../hooks/useAuth';
import { AuthService } from '../services/authService';

interface RegisterScreenProps {
  onNavigateToLogin?: () => void;
  onRegisterSuccess?: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  onNavigateToLogin,
  onRegisterSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const { colors, borderRadius } = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // OTP Verification States
  const [isVerified, setIsVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const [showGooglePicker, setShowGooglePicker] = useState(false);

  const { register, loginWithGoogle, isLoading, error, clearError } = useAuth();

  // Validate mobile number format: 10 digits starting with 6, 7, 8, or 9
  const validatePhone = (value: string): boolean => {
    const clean = value.replace(/\D/g, '');
    if (!clean) {
      setPhoneError('Mobile number is required');
      return false;
    }
    if (clean.length !== 10) {
      setPhoneError('Please enter a 10-digit mobile number');
      return false;
    }
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setPhoneError('Enter a valid mobile number starting with 6, 7, 8, or 9');
      return false;
    }
    setPhoneError(null);
    return true;
  };

  // Validate email format
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  // Verify all fields are valid before requesting OTP
  const validateFormBeforeOtp = (): boolean => {
    setValidationError(null);
    if (!name.trim()) {
      setValidationError('Please enter your full name');
      return false;
    }
    if (!email.trim() || !validateEmail(email)) {
      setValidationError('Please enter a valid email address');
      return false;
    }
    if (!validatePhone(phone)) {
      return false;
    }
    if (!password) {
      setValidationError('Please enter a password');
      return false;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return false;
    }
    if (!confirmPassword) {
      setValidationError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return false;
    }
    return true;
  };

  // Trigger Send OTP API
  const handleInitiateVerification = async () => {
    if (!validateFormBeforeOtp()) return;

    setIsSendingOtp(true);
    setValidationError(null);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await AuthService.sendSignupOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        password: password.trim(),
      });

      showSuccessToast(res.message || 'OTP sent to your Email and WhatsApp');
      setShowOtpModal(true);
    } catch (err: any) {
      const msg = err?.message || 'Failed to send OTP. Please check your network and details.';
      setValidationError(msg);
      showErrorToast(msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify entered OTPs
  const handleVerifyOtp = async (otpData: { emailOtp: string; whatsappOtp: string }) => {
    setIsVerifyingOtp(true);
    try {
      const cleanPhone = phone.replace(/\D/g, '');
      const res = await AuthService.verifySignupOtp({
        email: email.trim().toLowerCase(),
        phone: cleanPhone,
        emailOtp: otpData.emailOtp,
        whatsappOtp: otpData.whatsappOtp,
      });

      setIsVerified(true);
      setShowOtpModal(false);
      showSuccessToast(res.message || 'Account verified successfully!');
    } catch (err: any) {
      throw err;
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Resend fresh OTPs
  const handleResendOtp = async () => {
    const res = await AuthService.resendSignupOtp(email.trim().toLowerCase());
    showSuccessToast(res.message || 'Fresh OTPs sent to your Email and WhatsApp');
  };

  // Final account registration
  const handleRegister = async () => {
    setValidationError(null);

    if (!isVerified) {
      setValidationError('Please verify your account via OTP first.');
      return;
    }

    if (!name || !email || !phone || !password || !confirmPassword) {
      setValidationError('All fields are required.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');
    const success = await register({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: cleanPhone,
      password: password.trim(),
    });

    if (success && onRegisterSuccess) {
      onRegisterSuccess();
    }
  };

  const handleGoogleSignUpPress = () => {
    setShowGooglePicker(true);
  };

  const handleSelectGoogleAccount = async (account: {
    email: string;
    name?: string;
    password?: string;
  }) => {
    const success = await loginWithGoogle(account);
    if (success) {
      setShowGooglePicker(false);
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    }
  };

  const isFormComplete =
    !!name.trim() &&
    !!email.trim() &&
    phone.replace(/\D/g, '').length === 10 &&
    password.length >= 6 &&
    confirmPassword.length >= 6;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top + 12, 20),
            paddingBottom: Math.max(insets.bottom + 20, 24),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Top Nav Row */}
        <View style={styles.topNavRow}>
          {onNavigateToLogin ? (
            <TouchableOpacity
              onPress={onNavigateToLogin}
              activeOpacity={0.7}
              style={[
                styles.backBtn,
                { backgroundColor: colors.surfaceVariant, borderColor: colors.border },
              ]}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 38 }} />
          )}

          <View style={[styles.badgePill, { backgroundColor: colors.surfaceVariant }]}>
            <Text style={[styles.badgePillText, { color: colors.primary }]}>CREATE ACCOUNT</Text>
          </View>
        </View>

        {/* Brand Logo Header */}
        <AuthLogo size="medium" tagline="Create your account for faster checkout & tracking" />

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderRadius: borderRadius.xl,
            },
          ]}
        >
          {/* Full Name */}
          <AuthInput
            label="Full Name"
            iconName="person-outline"
            placeholder="John Doe"
            value={name}
            onChangeText={text => {
              setName(text);
              if (error) clearError();
              if (validationError) setValidationError(null);
            }}
            autoCapitalize="words"
          />

          {/* Email Address */}
          <AuthInput
            label="Email Address"
            iconName="mail-outline"
            placeholder="name@example.com"
            value={email}
            onChangeText={text => {
              setEmail(text);
              if (isVerified) setIsVerified(false);
              if (error) clearError();
              if (validationError) setValidationError(null);
            }}
            autoCapitalize="none"
            keyboardType="email-address"
            rightComponent={
              isVerified ? (
                <View style={[styles.verifiedPill, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              ) : null
            }
          />

          {/* Mobile Number (Required Field Next to Email) */}
          <AuthInput
            label="Mobile Number"
            iconName="call-outline"
            placeholder="98765 43210"
            prefix="+91"
            value={phone}
            onChangeText={text => {
              const numericOnly = text.replace(/\D/g, '');
              setPhone(numericOnly);
              if (isVerified) setIsVerified(false);
              if (phoneError) setPhoneError(null);
              if (error) clearError();
              if (validationError) setValidationError(null);
            }}
            keyboardType="phone-pad"
            maxLength={10}
            error={phoneError || undefined}
            rightComponent={
              isVerified ? (
                <View style={[styles.verifiedPill, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 3 }} />
                  <Text style={styles.verifiedPillText}>Verified</Text>
                </View>
              ) : null
            }
          />

          {/* Password */}
          <AuthInput
            label="Password"
            iconName="lock-closed-outline"
            placeholder="At least 6 characters"
            value={password}
            onChangeText={text => {
              setPassword(text);
              if (error) clearError();
              if (validationError) setValidationError(null);
            }}
            secureTextEntry
          />

          {/* Confirm Password */}
          <AuthInput
            label="Confirm Password"
            iconName="shield-checkmark-outline"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={text => {
              setConfirmPassword(text);
              if (error) clearError();
              if (validationError) setValidationError(null);
            }}
            secureTextEntry
            error={validationError || error || undefined}
          />

          {/* Verification Status & Trigger Section */}
          {!isVerified ? (
            <View
              style={[
                styles.verificationPromptBox,
                {
                  backgroundColor: colors.surfaceVariant + '70',
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <View style={styles.promptLeft}>
                <Ionicons name="shield-outline" size={20} color={colors.primary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.promptTitle, { color: colors.textPrimary }]}>
                    Account Verification Required
                  </Text>
                  <Text style={[styles.promptDesc, { color: colors.textSecondary }]}>
                    Verify Email & WhatsApp via OTP to enable account creation.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.verifyBtn,
                  {
                    backgroundColor: isFormComplete ? colors.primary : colors.surfaceVariant,
                    borderRadius: borderRadius.sm,
                  },
                ]}
                onPress={handleInitiateVerification}
                disabled={!isFormComplete || isSendingOtp}
                activeOpacity={0.8}
              >
                {isSendingOtp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <View style={styles.verifyBtnContent}>
                    <Text
                      style={[
                        styles.verifyBtnText,
                        { color: isFormComplete ? '#FFFFFF' : colors.textTertiary },
                      ]}
                    >
                      Verify Account
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={isFormComplete ? '#FFFFFF' : colors.textTertiary}
                      style={{ marginLeft: 4 }}
                    />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View
              style={[
                styles.verifiedBanner,
                {
                  backgroundColor: '#E8F5E9',
                  borderColor: '#A5D6A7',
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <Ionicons name="checkmark-done-circle" size={22} color="#2E7D32" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.verifiedBannerTitle}>Account Verified Successfully</Text>
                <Text style={styles.verifiedBannerDesc}>
                  Email & Mobile confirmed. You can now create your LBFresh account below.
                </Text>
              </View>
            </View>
          )}

          {/* Final Registration Button: Active ONLY after verification */}
          <View style={styles.registerButtonContainer}>
            <AuthButton
              title="Create LBFresh Account"
              loading={isLoading}
              disabled={!isVerified || !isFormComplete}
              onPress={handleRegister}
            />
            {!isVerified && isFormComplete && (
              <Text style={[styles.hintText, { color: colors.textTertiary }]}>
                Please click "Verify Account" above to enable this button
              </Text>
            )}
          </View>
        </View>

        {onNavigateToLogin && (
          <View style={styles.footerContainer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={onNavigateToLogin}>
              <Text style={[styles.footerLink, { color: colors.primary }]}>
                Sign In
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* OTP Verification Modal */}
      <OtpVerificationModal
        visible={showOtpModal}
        email={email}
        phone={phone}
        isLoading={isVerifyingOtp}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleVerifyOtp}
        onResendOtp={handleResendOtp}
      />

      {/* Google Identity Services Account Picker Modal */}
      <GoogleAccountPickerModal
        visible={showGooglePicker}
        loading={isLoading}
        onClose={() => setShowGooglePicker(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  badgePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSection: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: '800',
    marginLeft: 6,
  },
  socialDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '800',
    marginHorizontal: 12,
    letterSpacing: 0.5,
  },
  googleSignInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#2E7D32',
  },
  verificationPromptBox: {
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  promptLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  promptTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  promptDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  verifyBtn: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
  },
  verifyBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  verifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  verifiedBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#2E7D32',
    marginBottom: 2,
  },
  verifiedBannerDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: '#388E3C',
  },
  registerButtonContainer: {
    marginTop: 4,
  },
  hintText: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
