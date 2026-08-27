import { API_SETTINGS } from '../app/config';

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
  success?: boolean;
}

export class ApiClient {
  private static baseURL: string = API_SETTINGS.baseUrl;

  static setBaseURL(url: string) {
    this.baseURL = url;
  }

  static getBaseURL(): string {
    return this.baseURL;
  }

  static async get<T>(
    endpoint: string,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_SETTINGS.timeoutMs);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return { data, status: response.status, success: response.ok };
    } catch (error: any) {
      clearTimeout(timeoutId);
      return {
        data: null as any,
        status: 500,
        message: error.message || 'Network request failed',
        success: false,
      };
    }
  }

  static async post<T>(
    endpoint: string,
    body: any,
    headers: Record<string, string> = {}
  ): Promise<ApiResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_SETTINGS.timeoutMs);

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...headers,
        },
        body: JSON.stringify(body),
      });
      clearTimeout(timeoutId);

      const data = await response.json();
      return { data, status: response.status, success: response.ok };
    } catch (error: any) {
      clearTimeout(timeoutId);
      return {
        data: null as any,
        status: 500,
        message: error.message || 'Network request failed',
        success: false,
      };
    }
  }
}

export default ApiClient;
