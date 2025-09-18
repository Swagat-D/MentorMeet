import AsyncStorage from '@react-native-async-storage/async-storage';

interface NetworkInterface {
  name: string;
  address: string;
  type: 'wifi' | 'ethernet' | 'vmware' | 'other';
  priority: number;
}

interface BackendInfo {
  baseUrl: string;
  ip: string;
  port: number;
  isReachable: boolean;
  responseTime: number;
  lastChecked: number;
}

class NetworkDiscoveryService {
  private static readonly STORAGE_KEY = 'cached_backend_info';
  private static readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes (longer cache)
  private static readonly DEFAULT_PORT = 5000;
  private static readonly CONNECTION_TIMEOUT = 3000; // Reduced to 3 seconds
  private static readonly MAX_CONCURRENT_REQUESTS = 8; // Limit concurrent requests
  
  // Most likely IPs based on your backend output
  private static readonly PRIORITY_IPS = [
    '192.168.8.1',      
    '192.168.68.210',
    '192.168.1.1',      
    '192.168.0.1',      
    '10.0.0.1',         
  ];

  // Smart network ranges - start with most likely
  private static readonly SMART_RANGES = [
    { range: '192.168.8.', priority: 1, maxScan: 20 },      // VMware range (your backend shows this)
    { range: '192.168.137.', priority: 2, maxScan: 20 },   // Windows hotspot range
    { range: '192.168.220.', priority: 3, maxScan: 20 },   // VMware range
    { range: '192.168.1.', priority: 4, maxScan: 50 },     // Common home network
    { range: '192.168.0.', priority: 5, maxScan: 50 },     // Common home network
  ];

  /**
   * Get the cached backend info if it's still valid
   */
  private static async getCachedBackendInfo(): Promise<BackendInfo | null> {
    try {
      const cached = await AsyncStorage.getItem(this.STORAGE_KEY);
      if (!cached) return null;

      const backendInfo: BackendInfo = JSON.parse(cached);
      const isExpired = Date.now() - backendInfo.lastChecked > this.CACHE_DURATION;
      
      if (isExpired) {
        console.log('🕐 Cached backend info expired');
        return null;
      }

      console.log('📋 Using cached backend info:', backendInfo.baseUrl);
      return backendInfo;
    } catch (error) {
      console.error('❌ Error reading cached backend info:', error);
      return null;
    }
  }

  /**
   * Cache the backend info
   */
  private static async cacheBackendInfo(backendInfo: BackendInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEY, JSON.stringify(backendInfo));
      console.log('💾 Cached backend info:', backendInfo.baseUrl);
    } catch (error) {
      console.error('❌ Error caching backend info:', error);
    }
  }

  /**
   * Test if a specific IP and port combination is reachable
   */
  private static async testConnection(ip: string, port: number = this.DEFAULT_PORT): Promise<{ reachable: boolean; responseTime: number }> {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.CONNECTION_TIMEOUT);
      
      const response = await fetch(`http://${ip}:${port}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const data = await response.json();
        const isValidBackend = data.status === 'healthy' || data.message?.includes('MentorMatch');
        
        if (isValidBackend) {
          console.log(`✅ Backend found at ${ip}:${port} (${responseTime}ms)`);
          return { reachable: true, responseTime };
        }
      }
      
      return { reachable: false, responseTime };
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      // Don't log timeouts to reduce noise
      if (error.name !== 'AbortError') {
        console.log(`❌ Connection failed for ${ip}:${port}: ${error.message}`);
      }
      return { reachable: false, responseTime };
    }
  }

  /**
   * Test multiple IPs concurrently with a limit
   */
  private static async testMultipleIPs(ips: string[]): Promise<BackendInfo | null> {
    const chunks: string[][] = [];
    
    // Split IPs into chunks for concurrent processing
    for (let i = 0; i < ips.length; i += this.MAX_CONCURRENT_REQUESTS) {
      chunks.push(ips.slice(i, i + this.MAX_CONCURRENT_REQUESTS));
    }

    // Process chunks sequentially, but IPs within chunks concurrently
    for (const chunk of chunks) {
      const promises = chunk.map(async (ip) => {
        const { reachable, responseTime } = await this.testConnection(ip);
        if (reachable) {
          return {
            baseUrl: `http://${ip}:${this.DEFAULT_PORT}`,
            ip,
            port: this.DEFAULT_PORT,
            isReachable: true,
            responseTime,
            lastChecked: Date.now(),
          };
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validResult = results.find(result => result !== null);
      
      if (validResult) {
        return validResult;
      }
    }

    return null;
  }

  /**
   * Generate IPs for a range with smart limits
   */
  private static generateRangeIPs(baseRange: string, maxScan: number): string[] {
    const ips: string[] = [];
    
    // Always include common IPs first
    const commonLastOctets = [1, 100, 101, 102, 200, 201, 202, 210, 254];
    
    for (const octet of commonLastOctets) {
      if (ips.length >= maxScan) break;
      ips.push(`${baseRange}${octet}`);
    }
    
    // Fill remaining with sequential scan
    for (let i = 2; i <= 254 && ips.length < maxScan; i++) {
      if (!commonLastOctets.includes(i)) {
        ips.push(`${baseRange}${i}`);
      }
    }
    
    return ips;
  }

  /**
   * Quick check of priority IPs first
   */
  public static async quickDiscovery(): Promise<BackendInfo | null> {
    console.log('⚡ Starting quick backend discovery...');
    
    // First check cache
    const cached = await this.getCachedBackendInfo();
    if (cached) {
      // Verify cached backend is still reachable quickly
      const { reachable } = await this.testConnection(cached.ip, cached.port);
      if (reachable) {
        console.log('📋 Cached backend still reachable');
        return cached;
      } else {
        console.log('⚠️ Cached backend no longer reachable');
      }
    }
    
    // Test priority IPs concurrently
    console.log('🎯 Testing priority IPs:', this.PRIORITY_IPS);
    const result = await this.testMultipleIPs(this.PRIORITY_IPS);
    
    if (result) {
      await this.cacheBackendInfo(result);
      console.log(`⚡ Quick discovery successful: ${result.baseUrl}`);
      return result;
    }
    
    console.log('⚡ Quick discovery failed');
    return null;
  }

  /**
   * Smart range scanning - focuses on most likely networks first
   */
  public static async smartRangeScan(): Promise<BackendInfo | null> {
    console.log('🧠 Starting smart range scanning...');
    
    for (const { range, priority, maxScan } of this.SMART_RANGES) {
      console.log(`🔍 Scanning ${range}x network (max ${maxScan} IPs)...`);
      
      const ips = this.generateRangeIPs(range, maxScan);
      const result = await this.testMultipleIPs(ips);
      
      if (result) {
        console.log(`🎯 Found backend in ${range}x range: ${result.baseUrl}`);
        await this.cacheBackendInfo(result);
        return result;
      }
    }
    
    console.log('❌ Smart range scan completed, no backend found');
    return null;
  }

  /**
   * Main discovery method - optimized for speed
   */
  public static async discoverBackend(forceRefresh: boolean = false): Promise<BackendInfo | null> {
    try {
      console.log('🔍 Starting optimized backend discovery...');
      
      // Step 1: Quick discovery (priority IPs + cache)
      if (!forceRefresh) {
        const quickResult = await this.quickDiscovery();
        if (quickResult) return quickResult;
      }

      // Step 2: Smart range scanning
      const smartResult = await this.smartRangeScan();
      if (smartResult) return smartResult;
      
      console.log('❌ No backend servers found');
      return null;
      
    } catch (error) {
      console.error('❌ Backend discovery failed:', error);
      return null;
    }
  }

  /**
   * Get backend URL with automatic discovery - optimized for app startup
   */
  public static async getBackendUrl(forceRefresh: boolean = false): Promise<string> {
    try {
      // For app startup, prioritize speed over completeness
      let backend: BackendInfo | null = null;
      
      if (!forceRefresh) {
        // Try cache first
        backend = await this.getCachedBackendInfo();
        if (backend) {
          console.log('🚀 Using cached backend for fast startup');
          return backend.baseUrl;
        }
        
        // Quick priority IP check only for startup
        console.log('🚀 Quick priority IP check for startup...');
        backend = await this.testMultipleIPs(this.PRIORITY_IPS.slice(0, 4)); // Only test top 4
      }
      
      // Full discovery if forced or quick check failed
      if (!backend) {
        backend = await this.discoverBackend(forceRefresh);
      }
      
      if (backend) {
        return backend.baseUrl;
      }
      
      // Fallback - use most likely IP based on your backend output
      const fallbackUrl = 'http://192.168.8.1:5000'; // Your VMware adapter IP
      console.log(`⚠️ No backend found, using fallback: ${fallbackUrl}`);
      return fallbackUrl;
      
    } catch (error) {
      console.error('❌ Error getting backend URL:', error);
      return 'http://192.168.8.1:5000'; // Fallback
    }
  }

  /**
   * Test current backend connection
   */
  public static async testCurrentBackend(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      const cached = await this.getCachedBackendInfo();
      
      if (!cached) {
        return {
          success: false,
          message: 'No cached backend found. Starting discovery...',
        };
      }
      
      const { reachable, responseTime } = await this.testConnection(cached.ip, cached.port);
      
      if (reachable) {
        return {
          success: true,
          message: `Backend connection successful! (${responseTime}ms)`,
          details: {
            url: cached.baseUrl,
            responseTime,
            lastChecked: new Date(cached.lastChecked).toLocaleString(),
          },
        };
      } else {
        return {
          success: false,
          message: 'Cached backend is not reachable. Need to rediscover.',
          details: {
            lastKnownUrl: cached.baseUrl,
          },
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`,
      };
    }
  }

  /**
   * Clear cached backend info
   */
  public static async clearCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.STORAGE_KEY);
      console.log('🗑️ Backend cache cleared');
    } catch (error) {
      console.error('❌ Error clearing backend cache:', error);
    }
  }

  /**
   * Manual backend configuration
   */
  public static async setManualBackend(ip: string, port: number = this.DEFAULT_PORT): Promise<boolean> {
    try {
      const { reachable, responseTime } = await this.testConnection(ip, port);
      
      if (reachable) {
        const backendInfo: BackendInfo = {
          baseUrl: `http://${ip}:${port}`,
          ip,
          port,
          isReachable: true,
          responseTime,
          lastChecked: Date.now(),
        };
        
        await this.cacheBackendInfo(backendInfo);
        console.log(`✅ Manual backend set: ${backendInfo.baseUrl}`);
        return true;
      } else {
        console.log(`❌ Manual backend not reachable: ${ip}:${port}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error setting manual backend:', error);
      return false;
    }
  }
}

export default NetworkDiscoveryService;