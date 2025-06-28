// frontend/services/api.ts - API Configuration with Your IP
import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
const API_CONFIG = {
  // Using your actual Wi-Fi IP address (not VMware adapters)
  BASE_URL: __DEV__ 
    ? 'http://192.168.131.210:5000' // Your Wi-Fi IP - Use this one for mobile
    : 'https://your-production-api.com', // Your production API URL
  
  API_VERSION: '/api/v1',
  TIMEOUT: 30000, // 30 seconds
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REGISTER: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/register`,
  LOGIN: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/login`,
  VERIFY_EMAIL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/verify-email`,
  RESEND_OTP: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/resend-otp`,
  FORGOT_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/forgot-password`,
  RESET_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/reset-password`,
  CHANGE_PASSWORD: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/change-password`,
  GET_PROFILE: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/me`,
  UPDATE_PROFILE: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/profile`,
  LOGOUT: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/logout`,
  CHECK_AUTH: `${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/check`,
  AUTHENTICATION_WITH_GOOGLETOKEN :`${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/google`,
  UNLINK_GOOGLEACCOUNT :`${API_CONFIG.BASE_URL}${API_CONFIG.API_VERSION}/auth/unlink-google`,
  
  // Health check
  HEALTH: `${API_CONFIG.BASE_URL}/health`,
  TEST_MOBILE: `${API_CONFIG.BASE_URL}/test-mobile`,
  NETWORK_INFO: `${API_CONFIG.BASE_URL}/network-info`,
};

// HTTP request helper
export class ApiService {
  private static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<any> {
    try {
      const token = await this.getAuthToken();
      
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
      }

      const config: RequestInit = {
        ...options,
        headers: {
          ...defaultHeaders,
          ...options.headers,
        },
      };

      console.log(`🌐 API Request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      
      console.error(`❌ API Error for ${url}:`, error);
      
      // Network error handling
      if (error.message.includes('Network request failed') || 
          error.message.includes('fetch') ||
          error.message.includes('TypeError')) {
        throw new Error('Network error. Please check your internet connection and make sure the backend server is running.');
      }
      
      throw error;
    }
  }

  static async get(url: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  static async post(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(url: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, { ...options, method: 'DELETE' });
  }

  // Health check method
  static async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get(API_ENDPOINTS.HEALTH);
      return response.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  // Test mobile connectivity
  static async testMobileConnection(): Promise<any> {
    try {
      return await this.get(API_ENDPOINTS.TEST_MOBILE);
    } catch (error) {
      console.error('Mobile connection test failed:', error);
      throw error;
    }
  }

  // Get network info
  static async getNetworkInfo(): Promise<any> {
    try {
      return await this.get(API_ENDPOINTS.NETWORK_INFO);
    } catch (error) {
      console.error('Network info request failed:', error);
      throw error;
    }
  }
}

// Helper function to get the current server IP for development
export const getCurrentServerIP = (): string => {
  return '192.168.131.210';
};

// Helper to update API base URL dynamically (for development)
export const updateApiBaseUrl = (newBaseUrl: string): void => {
  // Update the configuration
  (API_CONFIG as any).BASE_URL = newBaseUrl;
  
  // Update all endpoints
  Object.keys(API_ENDPOINTS).forEach(key => {
    const endpoint = API_ENDPOINTS[key as keyof typeof API_ENDPOINTS];
    if (endpoint.includes('/api/v1')) {
      API_ENDPOINTS[key as keyof typeof API_ENDPOINTS] = 
        `${newBaseUrl}${API_CONFIG.API_VERSION}${endpoint.split('/api/v1')[1]}`;
    } else {
      API_ENDPOINTS[key as keyof typeof API_ENDPOINTS] = 
        `${newBaseUrl}${endpoint.split(/:\d+/)[1] || ''}`;
    }
  });
};

// Connection test helper
export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🔍 Testing backend connection...');
    
    // First try to get network info
    try {
      const networkInfo = await ApiService.getNetworkInfo();
      console.log('📡 Network info:', networkInfo);
      
      return {
        success: true,
        message: 'Backend connection successful! 🎉',
        details: networkInfo,
      };
    } catch (error) {
      // Fallback to health check
      const isHealthy = await ApiService.checkHealth();
      
      if (isHealthy) {
        return {
          success: true,
          message: 'Backend connection successful! 🎉',
        };
      } else {
        throw new Error('Health check failed');
      }
    }
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    
    return {
      success: false,
      message: `Connection failed: ${error.message}`,
      details: {
        currentBaseUrl: API_CONFIG.BASE_URL,
        suggestions: [
          'Make sure the backend server is running',
          'Check that your computer and mobile device are on the same WiFi network',
          'Try opening http://192.168.131.210:5000/health in your mobile browser',
          'Try disabling firewall temporarily',
          'Restart the backend server',
        ],
      },
    };
  }
};

export default ApiService;