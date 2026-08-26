export interface AuthUser {
  id: string;
  email: string;
  name: string;
  token?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export class AuthService {
  /**
   * Performs user login
   */
  static async login(payload: LoginPayload): Promise<AuthUser> {
    // Simulated network delay - replace with API endpoint call
    await new Promise<void>(resolve => setTimeout(() => resolve(), 800));

    if (!payload.email || !payload.password) {
      throw new Error('Email and password are required');
    }

    return {
      id: '1',
      email: payload.email,
      name: payload.email.split('@')[0],
      token: 'jwt_mock_token_sample',
    };
  }

  /**
   * Registers a new user
   */
  static async register(payload: RegisterPayload): Promise<AuthUser> {
    // Simulated network delay - replace with API endpoint call
    await new Promise<void>(resolve => setTimeout(() => resolve(), 800));

    if (!payload.name || !payload.email || !payload.password) {
      throw new Error('All fields are required');
    }

    return {
      id: '1',
      email: payload.email,
      name: payload.name,
      token: 'jwt_mock_token_sample',
    };
  }

  /**
   * Requests password reset
   */
  static async forgotPassword(email: string): Promise<boolean> {
    // Simulated network delay - replace with API endpoint call
    await new Promise<void>(resolve => setTimeout(() => resolve(), 800));

    if (!email) {
      throw new Error('Email is required');
    }

    return true;
  }

  /**
   * Logs out user
   */
  static async logout(): Promise<void> {
    await new Promise<void>(resolve => setTimeout(() => resolve(), 200));
  }
}
