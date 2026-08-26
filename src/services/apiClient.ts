export interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

export class ApiClient {
  private static baseURL: string = 'https://api.example.com';

  static setBaseURL(url: string) {
    this.baseURL = url;
  }

  static async get<T>(endpoint: string, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    });

    const data = await response.json();
    return { data, status: response.status };
  }

  static async post<T>(endpoint: string, body: any, headers: Record<string, string> = {}): Promise<ApiResponse<T>> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return { data, status: response.status };
  }
}
