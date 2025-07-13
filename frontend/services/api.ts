// frontend/services/api.ts - Updated API Service with Dynamic Discovery
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkDiscoveryService from './networkDiscovery';

// API Configuration - Now dynamic
class ApiConfig {
  private static _baseUrl: string = '';
  private static _initialized: boolean = false;

  static async getBaseUrl(): Promise<string> {
    if (!this._initialized || !this._baseUrl) {
      console.log('🚀 Initializing API configuration...');
      this._baseUrl = await NetworkDiscoveryService.getBackendUrl(); // This is now optimized
      this._initialized = true;
      console.log(`🌐 API Base URL set to: ${this._baseUrl}`);
    }
    return this._baseUrl;
  }

  static async refreshBaseUrl(): Promise<string> {
    console.log('🔄 Refreshing API base URL...');
    this._baseUrl = await NetworkDiscoveryService.getBackendUrl(true);
    console.log(`🌐 API Base URL refreshed to: ${this._baseUrl}`);
    return this._baseUrl;
  }

  static setBaseUrl(url: string): void {
    this._baseUrl = url;
    this._initialized = true;
    console.log(`🌐 API Base URL manually set to: ${url}`);
  }

  static get apiVersion(): string {
    return '/api/v1';
  }

  static get timeout(): number {
    return 30000; // 30 seconds
  }
}

// Dynamic API endpoints that update based on discovered backend
export class ApiEndpoints {
  static async getEndpoints() {
    const baseUrl = await ApiConfig.getBaseUrl();
    const apiVersion = ApiConfig.apiVersion;

    return {
      // Auth endpoints
      REGISTER: `${baseUrl}${apiVersion}/auth/register`,
      LOGIN: `${baseUrl}${apiVersion}/auth/login`,
      VERIFY_EMAIL: `${baseUrl}${apiVersion}/auth/verify-email`,
      RESEND_OTP: `${baseUrl}${apiVersion}/auth/resend-otp`,
      FORGOT_PASSWORD: `${baseUrl}${apiVersion}/auth/forgot-password`,
      RESET_PASSWORD: `${baseUrl}${apiVersion}/auth/reset-password`,
      CHANGE_PASSWORD: `${baseUrl}${apiVersion}/auth/change-password`,
      GET_PROFILE: `${baseUrl}${apiVersion}/auth/me`,
      UPDATE_PROFILE: `${baseUrl}${apiVersion}/auth/profile`,
      LOGOUT: `${baseUrl}${apiVersion}/auth/logout`,
      CHECK_AUTH: `${baseUrl}${apiVersion}/auth/check`,
      AUTHENTICATION_WITH_GOOGLETOKEN: `${baseUrl}${apiVersion}/auth/google`,
      UNLINK_GOOGLEACCOUNT: `${baseUrl}${apiVersion}/auth/unlink-google`,
      
      // Health check
      HEALTH: `${baseUrl}/health`,
      TEST_MOBILE: `${baseUrl}/test-mobile`,
      NETWORK_INFO: `${baseUrl}/network-info`,
    };
  }
}

// Enhanced HTTP request helper with automatic backend discovery
export class ApiService {
  private static retryCount = 0;
  private static maxRetries = 2;

  public static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<any> {
    try {
      // Get the dynamic URL for this endpoint
      const endpoints = await ApiEndpoints.getEndpoints();
      const url = (endpoints as any)[endpoint] || endpoint;

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
      const timeoutId = setTimeout(() => controller.abort(), ApiConfig.timeout);
      
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

      // Reset retry count on successful request
      this.retryCount = 0;
      return await response.json();

    } catch (error: any) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      
      // Handle network errors with automatic backend rediscovery
      const isNetworkError = error.name === 'AbortError' || 
                           error.message.includes('Network request failed') || 
                           error.message.includes('fetch') ||
                           error.message.includes('TypeError');

      if (isNetworkError && !isRetry && this.retryCount < this.maxRetries) {
        console.log('🔄 Network error detected, attempting backend rediscovery...');
        this.retryCount++;
        
        // Try to discover a new backend
        await ApiConfig.refreshBaseUrl();
        
        // Retry the request with the new backend
        return this.makeRequest(endpoint, options, true);
      }
      
      if (error.name === 'AbortError') {
        throw new Error('Request timeout. Please check your connection.');
      }
      
      // Reset retry count after max retries reached
      if (this.retryCount >= this.maxRetries) {
        this.retryCount = 0;
      }
      
      if (isNetworkError) {
        throw new Error('Network error. Please check your internet connection and make sure both devices are on the same WiFi network.');
      }
      
      throw error;
    }
  }

  // Helper method to make requests with full URLs (for backward compatibility)
  private static async makeDirectRequest(
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

      console.log(`🌐 Direct API Request: ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ApiConfig.timeout);
      
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
      console.error(`❌ Direct API Error for ${url}:`, error);
      throw error;
    }
  }

  // Public API methods using endpoint keys
  static async get(endpoint: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, { ...options, method: 'GET' });
  }

  static async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }

  // Direct URL methods (for backward compatibility and custom URLs)
  static async getUrl(url: string, options: RequestInit = {}): Promise<any> {
    return this.makeDirectRequest(url, { ...options, method: 'GET' });
  }

  static async postUrl(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeDirectRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async putUrl(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeDirectRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Backend discovery and health check methods
  static async discoverBackend(forceRefresh: boolean = false): Promise<boolean> {
    try {
      const newUrl = await NetworkDiscoveryService.getBackendUrl(forceRefresh);
      ApiConfig.setBaseUrl(newUrl);
      return true;
    } catch (error) {
      console.error('Backend discovery failed:', error);
      return false;
    }
  }

  static async checkHealth(): Promise<boolean> {
    try {
      const response = await this.get('HEALTH');
      return response.status === 'healthy';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }

  static async testMobileConnection(): Promise<any> {
    try {
      return await this.get('TEST_MOBILE');
    } catch (error) {
      console.error('Mobile connection test failed:', error);
      throw error;
    }
  }

  static async getNetworkInfo(): Promise<any> {
    try {
      return await this.get('NETWORK_INFO');
    } catch (error) {
      console.error('Network info request failed:', error);
      throw error;
    }
  }

  // Manual backend configuration
  static async setManualBackend(ip: string, port: number = 5000): Promise<boolean> {
    const success = await NetworkDiscoveryService.setManualBackend(ip, port);
    if (success) {
      ApiConfig.setBaseUrl(`http://${ip}:${port}`);
    }
    return success;
  }

  // Get current backend info
  static async getCurrentBackendInfo(): Promise<string> {
    return await ApiConfig.getBaseUrl();
  }

  // Clear backend cache
  static async clearBackendCache(): Promise<void> {
    await NetworkDiscoveryService.clearCache();
    ApiConfig._initialized = false;
  }
}

// Helper function to get the current server IP for development
export const getCurrentServerIP = async (): Promise<string> => {
  const baseUrl = await ApiConfig.getBaseUrl();
  const match = baseUrl.match(/http:\/\/([\d.]+):/);
  return match ? match[1] : 'unknown';
};

// Connection test helper with automatic discovery
export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🔍 Testing backend connection with auto-discovery...');
    
    // First try current cached backend
    let result = await NetworkDiscoveryService.testCurrentBackend();
    
    if (!result.success) {
      console.log('🔄 Current backend failed, discovering new one...');
      
      // Discover new backend
      const discovered = await ApiService.discoverBackend(true);
      
      if (discovered) {
        // Test the newly discovered backend
        result = await NetworkDiscoveryService.testCurrentBackend();
      }
    }
    
    if (result.success) {
      // Also test API endpoints
      try {
        const networkInfo = await ApiService.getNetworkInfo();
        result.details = { ...result.details, networkInfo };
      } catch (apiError) {
        console.log('⚠️ Backend reachable but API test failed:', apiError);
      }
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      details: {
        suggestions: [
          'Make sure the backend server is running',
          'Check that both devices are on the same WiFi network',
          'Try restarting the backend server',
          'Check firewall settings',
          'Try the manual setup option in settings',
        ],
      },
    };
  }
};

// Initialize API on app start
export const initializeApi = async (): Promise<void> => {
  try {
    console.log('🚀 Initializing API service...');
    await ApiConfig.getBaseUrl();
    console.log('✅ API service initialized');
  } catch (error) {
    console.error('❌ Failed to initialize API service:', error);
  }
};

export default ApiService;