// frontend/services/api.ts - Enhanced API Service with Dynamic Discovery and Better Error Handling
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkDiscoveryService from './networkDiscovery';

// API Configuration - Now dynamic with better caching
class ApiConfig {
  private static _baseUrl: string = '';
  private static _initialized: boolean = false;
  private static _initPromise: Promise<string> | null = null;

  static async getBaseUrl(): Promise<string> {
    // Return cached URL if available and valid
    if (this._initialized && this._baseUrl) {
      return this._baseUrl;
    }

    // If initialization is in progress, wait for it
    if (this._initPromise) {
      return await this._initPromise;
    }

    // Start initialization
    this._initPromise = this.initializeBaseUrl();
    return await this._initPromise;
  }

  private static async initializeBaseUrl(): Promise<string> {
    try {
      console.log('🚀 Initializing API configuration...');
      this._baseUrl = await NetworkDiscoveryService.getBackendUrl();
      this._initialized = true;
      this._initPromise = null;
      console.log(`🌐 API Base URL set to: ${this._baseUrl}`);
      return this._baseUrl;
    } catch (error) {
      this._initPromise = null;
      console.error('❌ Failed to initialize API base URL:', error);
      throw error;
    }
  }

  static async refreshBaseUrl(): Promise<string> {
    console.log('🔄 Refreshing API base URL...');
    this._initialized = false;
    this._initPromise = null;
    return await this.getBaseUrl();
  }

  static setBaseUrl(url: string): void {
    this._baseUrl = url;
    this._initialized = true;
    this._initPromise = null;
    console.log(`🌐 API Base URL manually set to: ${url}`);
  }

  static get apiVersion(): string {
    return '/api/v1';
  }

  static get timeout(): number {
    return 30000; // 30 seconds
  }

  static reset(): void {
    this._baseUrl = '';
    this._initialized = false;
    this._initPromise = null;
  }
}

// Enhanced API endpoints with better organization
export class ApiEndpoints {
  private static _cachedEndpoints: any = null;

  static async getEndpoints() {
    if (this._cachedEndpoints) {
      return this._cachedEndpoints;
    }

    const baseUrl = await ApiConfig.getBaseUrl();
    const apiVersion = ApiConfig.apiVersion;

    this._cachedEndpoints = {
      // Base URLs
      BASE_URL: baseUrl,
      API_BASE: `${baseUrl}${apiVersion}`,

      // Health and testing
      HEALTH: `${baseUrl}/health`,
      TEST_MOBILE: `${baseUrl}/test-mobile`,
      NETWORK_INFO: `${baseUrl}/network-info`,
      API_STATUS: `${baseUrl}${apiVersion}/status`,

      // Auth endpoints
      AUTH_BASE: `${baseUrl}${apiVersion}/auth`,
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
      GOOGLE_AUTH: `${baseUrl}${apiVersion}/auth/google`,
      UNLINK_GOOGLE: `${baseUrl}${apiVersion}/auth/unlink-google`,

      // Student endpoints
      STUDENT_BASE: `${baseUrl}${apiVersion}/student`,
      STUDENT_PROGRESS: `${baseUrl}${apiVersion}/student/progress`,
      STUDENT_SESSIONS: `${baseUrl}${apiVersion}/student/sessions/upcoming`,
      STUDENT_INSIGHTS: `${baseUrl}${apiVersion}/student/insights`,
      STUDENT_ACHIEVEMENTS: `${baseUrl}${apiVersion}/student/achievements`,
      STUDENT_WEEKLY_GOAL: `${baseUrl}${apiVersion}/student/goal/weekly`,

      // Mentor endpoints
      MENTORS_BASE: `${baseUrl}${apiVersion}/mentors`,
      MENTORS_SEARCH: `${baseUrl}${apiVersion}/mentors/search`,
      MENTORS_FEATURED: `${baseUrl}${apiVersion}/mentors/featured`,
      MENTORS_TRENDING: `${baseUrl}${apiVersion}/mentors/trending-expertise`,
      MENTORS_EXPERTISE: `${baseUrl}${apiVersion}/mentors/expertise`,
      MENTORS_ACTIVITY: `${baseUrl}${apiVersion}/mentors/activity`,
      MENTORS_STATS: `${baseUrl}${apiVersion}/mentors/stats/overview`,
    };

    return this._cachedEndpoints;
  }

  static clearCache(): void {
    this._cachedEndpoints = null;
  }

  // Helper method to build dynamic URLs
  static async buildUrl(endpoint: string, params?: Record<string, string>): Promise<string> {
    const endpoints = await this.getEndpoints();
    let url = endpoints[endpoint] || endpoint;

    if (params) {
      Object.keys(params).forEach(key => {
        url = url.replace(`:${key}`, params[key]);
      });
    }

    return url;
  }
}

// Enhanced HTTP request helper with better error handling and retry logic
export class ApiService {
  private static retryCount = 0;
  private static maxRetries = 3;
  private static retryDelay = 1000; // 1 second base delay

  public static async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('access_token');
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private static async makeRequest(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false,
    retryAttempt: number = 0
  ): Promise<any> {
    try {
      // Get the dynamic URL for this endpoint
      const url = await this.resolveEndpointUrl(endpoint);
      const token = await this.getAuthToken();
      
      const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'MentorMatch-Mobile/1.0',
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

      console.log(`🌐 API Request (attempt ${retryAttempt + 1}): ${options.method || 'GET'} ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ApiConfig.timeout);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      console.log(`📡 API Response: ${response.status} ${response.statusText}`);

      // Handle different response types
      if (!response.ok) {
        const errorData = await this.parseErrorResponse(response);
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Reset retry count on successful request
      this.retryCount = 0;
      return await response.json();

    } catch (error: any) {
      console.error(`❌ API Error for ${endpoint} (attempt ${retryAttempt + 1}):`, error);
      
      // Determine if we should retry
      const shouldRetry = this.shouldRetryRequest(error, retryAttempt);
      
      if (shouldRetry) {
        console.log(`🔄 Retrying request in ${this.retryDelay * (retryAttempt + 1)}ms...`);
        
        // Exponential backoff
        await this.delay(this.retryDelay * (retryAttempt + 1));
        
        // Try to refresh backend URL if network error
        if (this.isNetworkError(error) && retryAttempt === 0) {
          try {
            await ApiConfig.refreshBaseUrl();
            ApiEndpoints.clearCache();
          } catch (refreshError) {
            console.warn('⚠️ Failed to refresh backend URL:', refreshError);
          }
        }
        
        return this.makeRequest(endpoint, options, true, retryAttempt + 1);
      }
      
      // Transform error for better UX
      throw this.transformError(error);
    }
  }

  private static async resolveEndpointUrl(endpoint: string): Promise<string> {
    // If it's already a full URL, return as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }

    // If it's an endpoint key, resolve it
    const endpoints = await ApiEndpoints.getEndpoints();
    return endpoints[endpoint] || endpoint;
  }

  private static async parseErrorResponse(response: Response): Promise<any> {
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      } else {
        return { message: await response.text() };
      }
    } catch (error) {
      return { message: `HTTP ${response.status}: ${response.statusText}` };
    }
  }

  private static isNetworkError(error: any): boolean {
    return (
      error.name === 'AbortError' ||
      error.name === 'TypeError' ||
      error.message.includes('Network request failed') ||
      error.message.includes('fetch') ||
      error.message.includes('connection') ||
      error.code === 'NETWORK_ERROR'
    );
  }

  private static shouldRetryRequest(error: any, retryAttempt: number): boolean {
    // Don't retry if we've hit max attempts
    if (retryAttempt >= this.maxRetries) {
      return false;
    }

    // Don't retry on authentication errors
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return false;
    }

    // Don't retry on client errors (400-499) except for specific cases
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return error.status === 408 || error.status === 429; // Timeout or rate limit
    }

    // Retry on network errors and server errors
    return this.isNetworkError(error) || (error instanceof ApiError && error.status >= 500);
  }

  private static transformError(error: any): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.name === 'AbortError') {
      return new ApiError('Request timeout. Please check your connection.', 408);
    }
    
    if (this.isNetworkError(error)) {
      return new ApiError(
        'Network error. Please check your internet connection and ensure the server is running.',
        0,
        { originalError: error.message }
      );
    }
    
    return new ApiError(
      error.message || 'An unexpected error occurred',
      0,
      { originalError: error }
    );
  }

  // Public API methods with enhanced error handling
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

  static async patch(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, { ...options, method: 'DELETE' });
  }

  // Direct URL methods (for backward compatibility and custom URLs)
  static async getUrl(url: string, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, { ...options, method: 'GET' });
  }

  static async postUrl(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async putUrl(url: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(url, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Enhanced utility methods
  static async discoverBackend(forceRefresh: boolean = false): Promise<boolean> {
    try {
      console.log('🔍 Discovering backend...');
      if (forceRefresh) {
        ApiConfig.reset();
        ApiEndpoints.clearCache();
      }
      
      await ApiConfig.getBaseUrl();
      return true;
    } catch (error) {
      console.error('❌ Backend discovery failed:', error);
      return false;
    }
  }

  static async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const response = await this.get('HEALTH');
      return {
        healthy: response.status === 'healthy',
        details: response
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { healthy: false, details: error };
    }
  }

  static async checkApiStatus(): Promise<{ operational: boolean; details?: any }> {
    try {
      const response = await this.get('API_STATUS');
      return {
        operational: response.success && response.status === 'operational',
        details: response
      };
    } catch (error) {
      console.error('❌ API status check failed:', error);
      return { operational: false, details: error };
    }
  }

  static async testMobileConnection(): Promise<any> {
    return await this.get('TEST_MOBILE');
  }

  static async getNetworkInfo(): Promise<any> {
    return await this.get('NETWORK_INFO');
  }

  // Manual backend configuration
  static async setManualBackend(ip: string, port: number = 5000): Promise<boolean> {
    try {
      const url = `http://${ip}:${port}`;
      ApiConfig.setBaseUrl(url);
      ApiEndpoints.clearCache();
      
      // Test the connection
      const health = await this.checkHealth();
      return health.healthy;
    } catch (error) {
      console.error('❌ Manual backend setup failed:', error);
      return false;
    }
  }

  // Get current backend info
  static async getCurrentBackendInfo(): Promise<{
    baseUrl: string;
    apiBase: string;
    isHealthy: boolean;
  }> {
    const baseUrl = await ApiConfig.getBaseUrl();
    const endpoints = await ApiEndpoints.getEndpoints();
    const health = await this.checkHealth();
    
    return {
      baseUrl,
      apiBase: endpoints.API_BASE,
      isHealthy: health.healthy
    };
  }

  // Clear all caches
  static async clearCache(): Promise<void> {
    ApiConfig.reset();
    ApiEndpoints.clearCache();
    // Clear any other caches as needed
  }
}

// Custom error class for better error handling
export class ApiError extends Error {
  public status: number;
  public data?: any;

  constructor(message: string, status: number = 0, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Helper functions for backward compatibility
export const getCurrentServerIP = async (): Promise<string> => {
  try {
    const info = await ApiService.getCurrentBackendInfo();
    const match = info.baseUrl.match(/http:\/\/([\d.]+):/);
    return match ? match[1] : 'unknown';
  } catch (error) {
    return 'unknown';
  }
};

// Enhanced connection test with comprehensive diagnostics
export const testConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🔍 Running comprehensive connection test...');
    
    // Test 1: Backend discovery
    const discovered = await ApiService.discoverBackend(true);
    if (!discovered) {
      return {
        success: false,
        message: 'Failed to discover backend server',
        details: {
          step: 'discovery',
          suggestions: [
            'Ensure the backend server is running',
            'Check that both devices are on the same WiFi network',
            'Try manual IP configuration in settings'
          ]
        }
      };
    }

    // Test 2: Basic connectivity
    let mobileTest;
    try {
      mobileTest = await ApiService.testMobileConnection();
    } catch (error) {
      console.warn('⚠️ Mobile connection test failed:', error);
      mobileTest = null;
    }
    
    // Test 3: Health check
    const healthCheck = await ApiService.checkHealth();
    
    // Test 4: API status
    let apiStatus;
    try {
      apiStatus = await ApiService.checkApiStatus();
    } catch (error) {
      console.warn('⚠️ API status check failed:', error);
      apiStatus = { operational: false, details: error };
    }
    
    // Test 5: Network info
    let networkInfo;
    try {
      networkInfo = await ApiService.getNetworkInfo();
    } catch (error) {
      console.warn('⚠️ Network info test failed:', error);
      networkInfo = null;
    }

    const allTestsPassed = healthCheck.healthy && apiStatus.operational;
    
    return {
      success: allTestsPassed,
      message: allTestsPassed 
        ? 'All connection tests passed successfully' 
        : 'Some connection tests failed',
      details: {
        tests: {
          discovery: discovered,
          mobileConnection: !!mobileTest,
          health: healthCheck.healthy,
          apiStatus: apiStatus.operational,
          networkInfo: !!networkInfo
        },
        backend: await ApiService.getCurrentBackendInfo(),
        networkInfo,
        mobileTestResult: mobileTest,
        healthDetails: healthCheck.details,
        apiStatusDetails: apiStatus.details,
        suggestions: allTestsPassed ? [
          'Connection is working perfectly!',
          'All services are operational'
        ] : [
          'Check server logs for errors',
          'Verify firewall settings',
          'Ensure all required services are running',
          'Try restarting the backend server',
          'Check if the server IP address has changed'
        ]
      }
    };
    
  } catch (error: any) {
    console.error('❌ Connection test failed:', error);
    
    return {
      success: false,
      message: `Connection test failed: ${error.message}`,
      details: {
        error: error.message,
        errorType: error.name,
        step: 'test_execution',
        suggestions: [
          'Check internet connection',
          'Verify backend server is running',
          'Ensure both devices are on same network',
          'Try manual IP configuration',
          'Check firewall and security settings',
          'Restart both frontend and backend',
          'Check if the server port is accessible'
        ]
      }
    };
  }
};

// Initialize API on app start with better error handling
export const initializeApi = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    console.log('🚀 Initializing API service...');
    
    // Initialize base URL
    await ApiConfig.getBaseUrl();
    
    // Pre-cache endpoints
    await ApiEndpoints.getEndpoints();
    
    // Quick health check (with timeout)
    let health;
    try {
      const healthPromise = ApiService.checkHealth();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      );
      
      health = await Promise.race([healthPromise, timeoutPromise]) as { healthy: boolean; details?: any };
    } catch (error) {
      console.warn('⚠️ Health check failed during initialization:', error);
      health = { healthy: false, details: error };
    }
    
    if (health.healthy) {
      console.log('✅ API service initialized successfully');
      return {
        success: true,
        message: 'API service initialized successfully',
        details: {
          baseUrl: await ApiConfig.getBaseUrl(),
          healthStatus: health.details,
          timestamp: new Date().toISOString()
        }
      };
    } else {
      console.warn('⚠️ API service initialized but health check failed');
      return {
        success: false,
        message: 'API service initialized but backend is not healthy',
        details: {
          baseUrl: await ApiConfig.getBaseUrl(),
          healthStatus: health.details,
          timestamp: new Date().toISOString(),
          suggestions: [
            'Backend may be starting up - try again in a few moments',
            'Check backend server logs',
            'Verify database connectivity'
          ]
        }
      };
    }
    
  } catch (error: any) {
    console.error('❌ Failed to initialize API service:', error);
    return {
      success: false,
      message: `Failed to initialize API service: ${error.message}`,
      details: { 
        error: error.message,
        errorType: error.name,
        timestamp: new Date().toISOString(),
        suggestions: [
          'Check network connectivity',
          'Ensure backend server is running',
          'Try manual backend configuration',
          'Check for network firewall issues'
        ]
      }
    };
  }
};

// Utility function to check if API is ready
export const isApiReady = async (): Promise<boolean> => {
  try {
    const health = await ApiService.checkHealth();
    return health.healthy;
  } catch (error) {
    return false;
  }
};

// Utility function to get API status summary
export const getApiStatusSummary = async (): Promise<{
  status: 'ready' | 'degraded' | 'down';
  message: string;
  details: any;
}> => {
  try {
    const [health, apiStatus, backendInfo] = await Promise.allSettled([
      ApiService.checkHealth(),
      ApiService.checkApiStatus(),
      ApiService.getCurrentBackendInfo()
    ]);

    const healthResult = health.status === 'fulfilled' ? health.value : { healthy: false };
    const apiResult = apiStatus.status === 'fulfilled' ? apiStatus.value : { operational: false };
    const backendResult = backendInfo.status === 'fulfilled' ? backendInfo.value : null;

    if (healthResult.healthy && apiResult.operational) {
      return {
        status: 'ready',
        message: 'All systems operational',
        details: {
          health: healthResult.details,
          api: apiResult.details,
          backend: backendResult
        }
      };
    } else if (healthResult.healthy || apiResult.operational) {
      return {
        status: 'degraded',
        message: 'Some services are not fully operational',
        details: {
          health: healthResult.details,
          api: apiResult.details,
          backend: backendResult
        }
      };
    } else {
      return {
        status: 'down',
        message: 'Backend services are not available',
        details: {
          health: healthResult.details ? healthResult.details : (health.status === 'rejected' ? (health as PromiseRejectedResult).reason : null),
          api: apiResult.details ? apiResult.details : (apiStatus.status === 'rejected' ? (apiStatus as PromiseRejectedResult).reason : null),
          backend: backendResult
        }
      };
    }
  } catch (error: any) {
    return {
      status: 'down',
      message: `Failed to get API status: ${error.message}`,
      details: { error: error.message }
    };
  }
};

 export const apiRequest = async (url: string, options: any = {}) => {
  try {
    console.log('🌐 API Request:', { url, method: options.method });
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    console.log('📡 API Response Status:', response.status, response.statusText);
    
    // Get the response text first
    const responseText = await response.text();
    console.log('📄 Raw Response (first 200 chars):', responseText.substring(0, 200));
    
    // Try to parse as JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON Parse Error - Server returned HTML/non-JSON');
      console.error('📄 Full Response:', responseText);
      throw new Error(`Server error: ${response.status} - ${responseText.substring(0, 100)}`);
    }

    if (!response.ok) {
      throw new Error(data.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  } catch (error) {
    console.error('❌ API Request Error:', error);
    throw error;
  }
};

// Utility function for debugging API issues
export const debugApiConnection = async (): Promise<{
  report: string;
  details: any;
}> => {
  const report: string[] = [];
  const details: any = {};

  try {
    report.push('🔍 API Connection Debug Report');
    report.push('=====================================');
    
    // Check 1: Base configuration
    try {
      const baseUrl = await ApiConfig.getBaseUrl();
      report.push(`✅ Base URL: ${baseUrl}`);
      details.baseUrl = baseUrl;
    } catch (error) {
      report.push(`❌ Failed to get base URL: ${error}`);
      details.baseUrlError = error;
    }

    // Check 2: Endpoints
    try {
      const endpoints = await ApiEndpoints.getEndpoints();
      report.push(`✅ Endpoints loaded: ${Object.keys(endpoints).length} endpoints`);
      details.endpointsCount = Object.keys(endpoints).length;
      details.sampleEndpoints = {
        health: endpoints.HEALTH,
        auth: endpoints.AUTH_BASE,
        student: endpoints.STUDENT_BASE
      };
    } catch (error) {
      report.push(`❌ Failed to load endpoints: ${error}`);
      details.endpointsError = error;
    }

    // Check 3: Network connectivity
    try {
      const networkInfo = await ApiService.getNetworkInfo();
      report.push(`✅ Network info retrieved`);
      details.networkInfo = networkInfo;
    } catch (error) {
      report.push(`❌ Network info failed: ${error}`);
      details.networkError = error;
    }

    // Check 4: Authentication
    try {
      const token = await ApiService.getAuthToken();
      report.push(`${token ? '✅' : '⚠️'} Auth token: ${token ? 'Present' : 'Not found'}`);
      details.hasAuthToken = !!token;
      details.tokenLength = token?.length || 0;
    } catch (error) {
      report.push(`❌ Auth token check failed: ${error}`);
      details.authError = error;
    }

    // Check 5: Health status
    try {
      const health = await ApiService.checkHealth();
      report.push(`${health.healthy ? '✅' : '❌'} Health check: ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
      details.health = health;
    } catch (error) {
      report.push(`❌ Health check failed: ${error}`);
      details.healthError = error;
    }

    report.push('=====================================');
    
  } catch (error) {
    report.push(`❌ Debug report generation failed: ${error}`);
    details.debugError = error;
  }

  return {
    report: report.join('\n'),
    details
  };
};

// Export enhanced API service as default
export default ApiService;