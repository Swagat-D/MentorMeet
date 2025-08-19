// frontend/services/api.ts - Enhanced API Service with Dynamic Discovery and Better Error Handling
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetworkDiscoveryService from './networkDiscovery';
import NetInfo from '@react-native-community/netinfo';

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

  

  static async checkHealth(): Promise<{ healthy: boolean; details?: any }> {
    try {
      const endpoints = await ApiEndpoints.getEndpoints();
      const url = endpoints.HEALTH;
      const res = await fetch(url, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
      const response = await res.json();
      return {
        healthy: response.status === 'healthy',
        details: response
      };
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return { healthy: false, details: error };
    }
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

  static async makeAuthenticatedPsychometricRequest(
  endpoint: string, 
  options: any = {}
): Promise<any> {
  try {
    // Get auth token
    const token = await ApiService.getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Resolve endpoint URL
    const url = await this.resolveEndpointUrl(endpoint);
    
    // Enhanced headers for psychometric requests
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-Client-Type': 'mobile',
      'X-API-Version': 'v1',
      ...options.headers,
    };

    console.log(`🧠 Psychometric API Request: ${options.method || 'GET'} ${url}`);
    console.log(`🔑 Using auth token: ${token.substring(0, 20)}...`);

    const response = await fetch(url, {
      ...options,
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined,
      timeout: 45000, // 45 second timeout for psychometric requests
    });

    console.log(`📡 Psychometric API Response: ${response.status} ${response.statusText}`);

    // Get response text for better error handling
    const responseText = await response.text();
    console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 401) {
        // Clear invalid token
        await AsyncStorage.removeItem('access_token');
        throw new Error('Session expired. Please log in again.');
      } else if (response.status === 403) {
        throw new Error('Access denied. Please check your permissions.');
      } else if (response.status === 404) {
        throw new Error('Endpoint not found. Please check the server configuration.');
      } else if (response.status === 500) {
        throw new Error('Server error. Please try again later.');
      }

      // Try to parse error response
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch (parseError) {
        // Use the raw response if JSON parsing fails
        errorMessage = responseText.substring(0, 200) || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    // Parse successful response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      throw new Error('Invalid response format from server');
    }

    // Check for API-level errors
    if (data.success === false) {
      throw new Error(data.message || 'Request failed');
    }

    return data;

  } catch (error: any) {
    console.error(`❌ Psychometric API Error for ${endpoint}:`, error);
    
    // Transform network errors for better UX
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
      throw new Error('Request timeout. Please check your connection and try again.');
    } else if (error.message?.includes('Network request failed') || 
               error.message?.includes('fetch')) {
      throw new Error('Network error. Please check your internet connection.');
    }
    
    throw error;
  }
}

static async getPsychometricTest(): Promise<any> {
  return await this.makeAuthenticatedPsychometricRequest('PSYCHOMETRIC_USER_TEST', {
    method: 'GET'
  });
}

static async submitPsychometricSection(
  sectionType: string, 
  data: any
): Promise<any> {
  const endpointMap = {
    'riasec': 'PSYCHOMETRIC_RIASEC',
    'brainProfile': 'PSYCHOMETRIC_BRAIN_PROFILE', 
    'employability': 'PSYCHOMETRIC_EMPLOYABILITY',
    'personalInsights': 'PSYCHOMETRIC_PERSONAL_INSIGHTS'
  };
  
  const endpoint = endpointMap[sectionType as keyof typeof endpointMap];
  if (!endpoint) {
    throw new Error(`Unknown section type: ${sectionType}`);
  }
  
  return await this.makeAuthenticatedPsychometricRequest(endpoint, {
    method: 'POST',
    body: data
  });
}

static async savePsychometricProgress(data: any): Promise<any> {
  return await this.makeAuthenticatedPsychometricRequest('PSYCHOMETRIC_SAVE_PROGRESS', {
    method: 'POST',
    body: data
  });
}

static async diagnosePsychometricConnection(): Promise<{
  success: boolean;
  message: string;
  details: any;
}> {
  try {
    console.log('🔍 Diagnosing psychometric connection...');
    
    const results = {
      networkConnectivity: false,
      authToken: false,
      backendReachable: false,
      psychometricService: false,
      userAuthenticated: false
    };
    
    const details: any = {};

    // 1. Check network connectivity
    try {
      const netInfo = await NetInfo.fetch();
      results.networkConnectivity = (netInfo.isConnected ?? false) && (netInfo.isInternetReachable ?? false);
      details.network = netInfo;
    } catch (error) {
      details.networkError = error;
    }

    // 2. Check auth token
    try {
      const token = await ApiService.getAuthToken();
      results.authToken = !!token;
      details.tokenLength = token?.length || 0;
    } catch (error) {
      details.authError = error;
    }

    // 3. Check backend health
    try {
      const health = await this.checkHealth();
      results.backendReachable = health.healthy;
      details.backendHealth = health;
    } catch (error) {
      details.backendError = error;
    }

    // 4. Check psychometric service
    try {
      const endpoints = await ApiEndpoints.getEndpoints();
      const testResponse = await fetch(endpoints.PSYCHOMETRIC_TEST, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      results.psychometricService = testResponse.ok;
      details.psychometricStatus = testResponse.status;
    } catch (error) {
      details.psychometricError = error;
    }

    // 5. Check user authentication with psychometric service
    if (results.authToken && results.psychometricService) {
      try {
        const testData = await this.getPsychometricTest();
        results.userAuthenticated = !!testData;
        details.testAccess = testData;
      } catch (error) {
        details.authTestError = error;
      }
    }

    const allPassed = Object.values(results).every(Boolean);
    
    return {
      success: allPassed,
      message: allPassed 
        ? 'All psychometric connection checks passed' 
        : 'Some psychometric connection checks failed',
      details: { results, ...details }
    };

  } catch (error: any) {
    return {
      success: false,
      message: `Connection diagnosis failed: ${error.message}`,
      details: { error: error.message }
    };
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

  // Add this method to resolve endpoint keys to URLs
  static async resolveEndpointUrl(endpoint: string): Promise<string> {
    // If it's already a full URL, return as is
    if (endpoint.startsWith('http')) {
      return endpoint;
    }
    // If it's an endpoint key, resolve it
    const endpoints = await ApiEndpoints.getEndpoints();
    return endpoints[endpoint] || endpoint;
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

      // Psychometric endpoints
      PSYCHOMETRIC_BASE: `${baseUrl}${apiVersion}/psychometric`,
      PSYCHOMETRIC_TEST: `${baseUrl}${apiVersion}/psychometric/test`,
      PSYCHOMETRIC_USER_TEST: `${baseUrl}${apiVersion}/psychometric/user-test`,
      PSYCHOMETRIC_RIASEC: `${baseUrl}${apiVersion}/psychometric/riasec`,
      PSYCHOMETRIC_BRAIN_PROFILE: `${baseUrl}${apiVersion}/psychometric/brain-profile`,
      PSYCHOMETRIC_EMPLOYABILITY: `${baseUrl}${apiVersion}/psychometric/employability`,
      PSYCHOMETRIC_PERSONAL_INSIGHTS: `${baseUrl}${apiVersion}/psychometric/personal-insights`,
      PSYCHOMETRIC_RESULTS: `${baseUrl}${apiVersion}/psychometric/results`,
      PSYCHOMETRIC_HISTORY: `${baseUrl}${apiVersion}/psychometric/history`,
      PSYCHOMETRIC_SAVE_PROGRESS: `${baseUrl}${apiVersion}/psychometric/save-progress`,
      PSYCHOMETRIC_VALIDATE: `${baseUrl}${apiVersion}/psychometric/validate-section`,
      PSYCHOMETRIC_CAREER_REC: `${baseUrl}${apiVersion}/psychometric/career-recommendations`,

      // Booking endpoints (ADD THESE)
      BOOKING_BASE: `${baseUrl}${apiVersion}/booking`,
      BOOKING_AVAILABLE_SLOTS: `${baseUrl}${apiVersion}/booking/available-slots`,
      BOOKING_CREATE: `${baseUrl}${apiVersion}/booking/create`,
      BOOKING_CANCEL: `${baseUrl}${apiVersion}/booking/:bookingId/cancel`,
      BOOKING_RESCHEDULE: `${baseUrl}${apiVersion}/booking/:bookingId/reschedule`,
      BOOKING_USER_BOOKINGS: `${baseUrl}${apiVersion}/booking/user-bookings`,
      BOOKING_DETAILS: `${baseUrl}${apiVersion}/booking/:bookingId`,

      // Cal.com integration endpoints
      CALCOM_BASE: `${baseUrl}${apiVersion}/calcom`,
      CALCOM_EVENT_TYPES: `${baseUrl}${apiVersion}/calcom/event-types`,
      CALCOM_AVAILABILITY: `${baseUrl}${apiVersion}/calcom/availability`,
      CALCOM_BOOKINGS: `${baseUrl}${apiVersion}/calcom/bookings`,
      CALCOM_SYNC: `${baseUrl}${apiVersion}/calcom/sync-mentor`,

      // Payment endpoints - FIXED
      PAYMENT_PROCESS: `${baseUrl}${apiVersion}/booking/payment/process`,
      PAYMENT_REFUND: `${baseUrl}${apiVersion}/booking/payment/refund`,
      PAYMENT_VALIDATE: `${baseUrl}${apiVersion}/booking/payment/validate`,

      // Notification endpoints - FIXED
      NOTIFICATION_SETUP: `${baseUrl}${apiVersion}/booking/notifications/setup-reminders`,
      NOTIFICATION_CANCEL: `${baseUrl}${apiVersion}/booking/notifications/cancellation`,
      NOTIFICATION_RESCHEDULE: `${baseUrl}${apiVersion}/booking/notifications/reschedule`,

      // Notifications endpoints
      NOTIFICATIONS_BASE: `${baseUrl}${apiVersion}/notifications`,
      GET_NOTIFICATIONS: `${baseUrl}${apiVersion}/notifications`,
      MARK_NOTIFICATION_READ: `${baseUrl}${apiVersion}/notifications/:notificationId/read`,
      MARK_ALL_NOTIFICATIONS_READ: `${baseUrl}${apiVersion}/notifications/read-all`,
      DELETE_NOTIFICATION: `${baseUrl}${apiVersion}/notifications/:notificationId`,
      CLEAR_ALL_NOTIFICATIONS: `${baseUrl}${apiVersion}/notifications/clear-all`,
      GET_UNREAD_COUNT: `${baseUrl}${apiVersion}/notifications/unread-count`,
      NOTIFICATIONS_STATS: `${baseUrl}${apiVersion}/notifications/stats`,

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

  // URL parameter replacement method for notifications
  private static replaceUrlParams(url: string, params: Record<string, string> = {}): string {
    let finalUrl = url;
    Object.entries(params).forEach(([key, value]) => {
      finalUrl = finalUrl.replace(`:${key}`, value);
    });
    return finalUrl;
  }

  static async diagnosePsychometricConnection(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    const results = { networkConnectivity: false, serverReachable: false };
    const details: any = {};

    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      results.networkConnectivity = (netInfo.isConnected ?? false) && (netInfo.isInternetReachable ?? false);
      details.network = netInfo;

      // Check server health
      const healthCheck = await this.checkHealth();
      results.serverReachable = healthCheck.healthy;
      details.healthCheck = healthCheck;

      // Check auth token
      const token = await this.getAuthToken();
      details.hasToken = !!token;

      return {
        success: results.networkConnectivity && results.serverReachable,
        message: results.networkConnectivity ? 
          (results.serverReachable ? 'Connection healthy' : 'Server unreachable') : 
          'No network connection',
        details
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection diagnostic failed',
        details: { error }
      };
    }
  }

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
  console.log('🔑 Adding auth header with token:', token.substring(0, 20) + '...');
} else {
  console.log('⚠️ No auth token found for request');
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

      const responseText = await response.text();
    console.log(`📄 Response preview: ${responseText.substring(0, 200)}...`);

    // Check if response is HTML (404 page)
    if (responseText.trim().startsWith('<')) {
      throw new ApiError(
        `Endpoint not found: ${url}. Server returned HTML instead of JSON.`,
        response.status,
        { url, responsePreview: responseText.substring(0, 500) }
      );
    }

      // Handle different response types
      if (!response.ok) {
        let errorData;
        try{
          errorData = JSON.parse(responseText);
        } catch{
          errorData = { message: responseText};
        }
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse response as JSON:', parseError);
      throw new ApiError('Invalid JSON response from server', response.status, { 
        responseText: responseText.substring(0, 500) 
      });
    }

      // Reset retry count on successful request
      this.retryCount = 0;
      return data;

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
    if (endpoint.startsWith('/')) {
    const baseUrl = await ApiConfig.getBaseUrl();
    const apiVersion = ApiConfig.apiVersion;
    
    // Check if it already includes api version
    if (endpoint.startsWith('/api/v1/')) {
      return `${baseUrl}${endpoint}`;
    } else {
      return `${baseUrl}${apiVersion}${endpoint}`;
    }
  }

    // If it's an endpoint key, resolve it
    const endpoints = await ApiEndpoints.getEndpoints();
    const resolvedUrl = endpoints[endpoint];

    if (!resolvedUrl){
      throw new Error(`Unknown endpoint: ${endpoint}`);
    }
    return resolvedUrl;
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

  // Updated public API methods with enhanced error handling and URL parameter support
  static async get(endpoint: string, options: {
    params?: Record<string, any>;
    urlParams?: Record<string, string>;
  } = {}): Promise<any> {
    try {
      let url = await this.resolveEndpointUrl(endpoint);
      
      // Replace URL parameters (like :notificationId)
      if (options.urlParams) {
        url = this.replaceUrlParams(url, options.urlParams);
      }
      
      // Add query parameters
      if (options.params && Object.keys(options.params).length > 0) {
        const queryString = new URLSearchParams(options.params).toString();
        url += `?${queryString}`;
      }

      return this.makeRequest(url, { method: 'GET' });
    } catch (error) {
      console.error(`❌ GET ${endpoint} failed:`, error);
      throw this.transformError(error);
    }
  }

  static async post(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async put(endpoint: string, data?: any, options: {
    params?: Record<string, any>;
    urlParams?: Record<string, string>;
  } = {}): Promise<any> {
    try {
      let url = await this.resolveEndpointUrl(endpoint);
      
      // Replace URL parameters (like :notificationId)
      if (options.urlParams) {
        url = this.replaceUrlParams(url, options.urlParams);
      }
      
      // Add query parameters
      if (options.params && Object.keys(options.params).length > 0) {
        const queryString = new URLSearchParams(options.params).toString();
        url += `?${queryString}`;
      }

      return this.makeRequest(url, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      console.error(`❌ PUT ${endpoint} failed:`, error);
      throw this.transformError(error);
    }
  }

  static async patch(endpoint: string, data?: any, options: RequestInit = {}): Promise<any> {
    return this.makeRequest(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  static async delete(endpoint: string, options: {
    params?: Record<string, any>;
    urlParams?: Record<string, string>;
  } = {}): Promise<any> {
    try {
      let url = await this.resolveEndpointUrl(endpoint);
      
      // Replace URL parameters (like :notificationId)
      if (options.urlParams) {
        url = this.replaceUrlParams(url, options.urlParams);
      }
      
      // Add query parameters
      if (options.params && Object.keys(options.params).length > 0) {
        const queryString = new URLSearchParams(options.params).toString();
        url += `?${queryString}`;
      }

      return this.makeRequest(url, { method: 'DELETE' });
    } catch (error) {
      console.error(`❌ DELETE ${endpoint} failed:`, error);
      throw this.transformError(error);
    }
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

  // Notification API methods
  static async getNotifications(params: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
  } = {}): Promise<any> {
    return this.get('GET_NOTIFICATIONS', { params });
  }

  static async markNotificationAsRead(notificationId: string): Promise<any> {
    return this.put('MARK_NOTIFICATION_READ', null, {
      urlParams: { notificationId }
    });
  }

  static async markAllNotificationsAsRead(): Promise<any> {
    return this.put('MARK_ALL_NOTIFICATIONS_READ');
  }

  static async deleteNotification(notificationId: string): Promise<any> {
    return this.delete('DELETE_NOTIFICATION', {
      urlParams: { notificationId }
    });
  }

  static async clearAllNotifications(): Promise<any> {
    return this.delete('CLEAR_ALL_NOTIFICATIONS');
  }

  static async getUnreadCount(): Promise<any> {
    return this.get('GET_UNREAD_COUNT');
  }

  static async getNotificationsByType(type: string): Promise<any> {
    return this.get('GET_NOTIFICATIONS', {
      params: { type }
    });
  }

  static async getNotificationStats(): Promise<any> {
    return this.get('NOTIFICATIONS_STATS');
  }

  static async getAvailableSlots(mentorId: string, date: string): Promise<any> {
  return await this.post('BOOKING_AVAILABLE_SLOTS', {
    mentorId,
    date
  });
}

// Create a new booking
static async createBooking(bookingData: {
  mentorId: string;
  timeSlot: any;
  sessionType: 'video';
  subject: string;
  notes?: string;
  paymentMethodId: string;
}): Promise<any> {
  return await this.post('BOOKING_CREATE', bookingData);
}

// Get user's bookings
static async getUserBookings(params: {
  status?: 'upcoming' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
} = {}): Promise<any> {
  return await this.get('BOOKING_USER_BOOKINGS', { params });
}

// Get booking details
static async getBookingDetails(bookingId: string): Promise<any> {
  return await this.get('BOOKING_DETAILS', {
    urlParams: { bookingId }
  });
}

// Cancel a booking
static async cancelBooking(bookingId: string, reason?: string): Promise<any> {
  return await this.put('BOOKING_CANCEL', { reason }, {
    urlParams: { bookingId }
  });
}

// Validate payment method
static async validatePaymentMethod(paymentMethodId: string): Promise<any> {
  return await this.get('PAYMENT_VALIDATE', {
    params: { paymentMethodId }
  });
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