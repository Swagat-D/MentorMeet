// frontend/config/backendConfig.ts - Create this new file

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface BackendConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
  isHealthy: boolean;
}

export class BackendConnectionManager {
  private static instance: BackendConnectionManager;
  private config: BackendConfig | null = null;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  static getInstance(): BackendConnectionManager {
    if (!BackendConnectionManager.instance) {
      BackendConnectionManager.instance = new BackendConnectionManager();
    }
    return BackendConnectionManager.instance;
  }

  /**
   * Initialize backend connection with auto-discovery
   */
  async initialize(): Promise<BackendConfig> {
    try {
      console.log('🚀 Initializing backend connection...');
      
      // Try saved configuration first
      const savedConfig = await this.getSavedConfig();
      if (savedConfig && await this.testConnection(savedConfig.baseUrl)) {
        this.config = savedConfig;
        this.startHealthMonitoring();
        return savedConfig;
      }

      // Auto-discover backend
      const discoveredUrl = await this.discoverBackend();
      const newConfig: BackendConfig = {
        baseUrl: discoveredUrl,
        timeout: 45000,
        retries: 3,
        isHealthy: true
      };

      await this.saveConfig(newConfig);
      this.config = newConfig;
      this.startHealthMonitoring();
      
      console.log('✅ Backend connection initialized:', newConfig.baseUrl);
      return newConfig;

    } catch (error) {
      console.error('❌ Failed to initialize backend connection:', error);
      throw error;
    }
  }

  /**
   * Auto-discover backend server
   */
  private async discoverBackend(): Promise<string> {
    console.log('🔍 Auto-discovering backend server...');
    
    // Common development IPs and ports to try
    const commonIPs = [
      '192.168.1.1', '192.168.1.100', '192.168.1.101', '192.168.1.102',
      '192.168.0.1', '192.168.0.100', '192.168.0.101', '192.168.0.102',
      '192.168.8.1', '192.168.8.100', '192.168.8.101', '192.168.8.102',
      '10.0.2.2', // Android emulator
      'localhost', '127.0.0.1'
    ];
    
    const ports = [5000, 3000, 8000, 8080];
    
    // Get network info to prioritize same subnet
    let prioritizedIPs = [...commonIPs];
    try {
      const netInfo = await NetInfo.fetch();
      if (netInfo.details && 'ipAddress' in netInfo.details) {
        const deviceIP = netInfo.details.ipAddress as string;
        const subnet = deviceIP.substring(0, deviceIP.lastIndexOf('.'));
        
        // Add IPs from same subnet to the front
        const subnetIPs = Array.from({length: 20}, (_, i) => `${subnet}.${i + 100}`);
        prioritizedIPs = [...subnetIPs, ...commonIPs];
      }
    } catch (error) {
      console.warn('⚠️ Could not get network info for discovery');
    }

    // Test each combination
    for (const ip of prioritizedIPs) {
      for (const port of ports) {
        const url = `http://${ip}:${port}`;
        console.log(`🔍 Testing: ${url}`);
        
        if (await this.testConnection(url)) {
          console.log(`✅ Found backend at: ${url}`);
          return url;
        }
      }
    }

    throw new Error('Could not discover backend server. Please configure manually.');
  }

  /**
   * Test connection to a backend URL
   */
  private async testConnection(baseUrl: string): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'healthy';
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Save backend configuration
   */
  private async saveConfig(config: BackendConfig): Promise<void> {
    try {
      await AsyncStorage.setItem('backend_config', JSON.stringify(config));
    } catch (error) {
      console.warn('⚠️ Failed to save backend config:', error);
    }
  }

  /**
   * Get saved backend configuration
   */
  private async getSavedConfig(): Promise<BackendConfig | null> {
    try {
      const saved = await AsyncStorage.getItem('backend_config');
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      console.warn('⚠️ Failed to get saved backend config:', error);
      return null;
    }
  }

  /**
   * Start monitoring backend health
   */
  private startHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.config) {
        const isHealthy = await this.testConnection(this.config.baseUrl);
        if (this.config.isHealthy !== isHealthy) {
          this.config.isHealthy = isHealthy;
          console.log(`💓 Backend health changed: ${isHealthy ? 'healthy' : 'unhealthy'}`);
        }
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Stop health monitoring
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): BackendConfig | null {
    return this.config;
  }

  /**
   * Manually set backend URL
   */
  async setManualBackend(url: string): Promise<boolean> {
    try {
      console.log(`🔧 Manually setting backend to: ${url}`);
      
      if (await this.testConnection(url)) {
        const newConfig: BackendConfig = {
          baseUrl: url,
          timeout: 45000,
          retries: 3,
          isHealthy: true
        };
        
        await this.saveConfig(newConfig);
        this.config = newConfig;
        this.startHealthMonitoring();
        
        console.log('✅ Manual backend configuration successful');
        return true;
      } else {
        console.log('❌ Manual backend configuration failed - server not reachable');
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting manual backend:', error);
      return false;
    }
  }

  /**
   * Get comprehensive connection status
   */
  async getConnectionStatus(): Promise<{
    isConfigured: boolean;
    isHealthy: boolean;
    baseUrl?: string;
    lastCheck: string;
    networkConnected: boolean;
    details: any;
  }> {
    const netInfo = await NetInfo.fetch();
    const networkConnected = Boolean(netInfo.isConnected) && Boolean(netInfo.isInternetReachable);
    
    if (!this.config) {
      return {
        isConfigured: false,
        isHealthy: false,
        lastCheck: new Date().toISOString(),
        networkConnected,
        details: { error: 'Backend not configured' }
      };
    }

    const isHealthy = await this.testConnection(this.config.baseUrl);
    
    return {
      isConfigured: true,
      isHealthy,
      baseUrl: this.config.baseUrl,
      lastCheck: new Date().toISOString(),
      networkConnected,
      details: {
        config: this.config,
        network: netInfo
      }
    };
  }

  /**
   * Refresh connection (re-discover if needed)
   */
  async refreshConnection(): Promise<BackendConfig> {
    console.log('🔄 Refreshing backend connection...');
    this.stopHealthMonitoring();
    this.config = null;
    
    return await this.initialize();
  }
}

// Export singleton instance
export const backendManager = BackendConnectionManager.getInstance();

// Helper functions for easy use
export const initializeBackend = () => backendManager.initialize();
export const getBackendConfig = () => backendManager.getConfig();
export const setManualBackend = (url: string) => backendManager.setManualBackend(url);
export const getConnectionStatus = () => backendManager.getConnectionStatus();
export const refreshBackendConnection = () => backendManager.refreshConnection();