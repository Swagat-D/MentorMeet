import { Request } from 'express';

/**
 * Extract and normalize IP address from request
 * Handles various proxy configurations and IP formats
 */
export const extractClientIP = (req: Request): string => {
  // Check various headers that might contain the real client IP
  const forwardedFor = req.headers['x-forwarded-for'];
  const realIP = req.headers['x-real-ip'];
  const cfConnectingIP = req.headers['cf-connecting-ip']; // Cloudflare
  const fastlyClientIP = req.headers['fastly-client-ip']; // Fastly CDN
  const trueClientIP = req.headers['true-client-ip']; // Akamai and other CDNs
  
  let clientIP: string;

  // Priority order for IP extraction
  if (typeof cfConnectingIP === 'string') {
    clientIP = cfConnectingIP;
  } else if (typeof trueClientIP === 'string') {
    clientIP = trueClientIP;
  } else if (typeof fastlyClientIP === 'string') {
    clientIP = fastlyClientIP;
  } else if (typeof realIP === 'string') {
    clientIP = realIP;
  } else if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    clientIP = Array.isArray(forwardedFor) 
      ? forwardedFor[0] 
      : forwardedFor.split(',')[0].trim();
  } else {
    clientIP = req.ip || req.socket.remoteAddress || 'unknown';
  }

  return normalizeIPAddress(clientIP);
};

/**
 * Normalize IP address to consistent format
 * Converts IPv6-mapped IPv4 addresses and handles edge cases
 */
export const normalizeIPAddress = (ip: string): string => {
  if (!ip || ip === 'unknown') return '127.0.0.1'; // Default fallback
  
  // Remove any whitespace
  ip = ip.trim();
  
  // Convert IPv6-mapped IPv4 addresses (::ffff:192.168.1.1 -> 192.168.1.1)
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }
  
  // Convert localhost variations
  if (ip === '::1' || ip === '::') {
    return '127.0.0.1';
  }
  
  // Handle port numbers (remove port if present)
  if (ip.includes(':') && !ip.includes('::')) {
    // IPv4 with port (192.168.1.1:8080)
    const parts = ip.split(':');
    if (parts.length === 2 && isValidIPv4(parts[0])) {
      return parts[0];
    }
  }
  
  return ip;
};

/**
 * Validate if string is a valid IPv4 address
 */
export const isValidIPv4 = (ip: string): boolean => {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  return ipv4Regex.test(ip);
};

/**
 * Validate if string is a valid IPv6 address
 */
export const isValidIPv6 = (ip: string): boolean => {
  const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
  return ipv6Regex.test(ip);
};

/**
 * Validate if string is a valid IP address (IPv4 or IPv6)
 */
export const isValidIP = (ip: string): boolean => {
  return isValidIPv4(ip) || isValidIPv6(ip);
};

/**
 * Get IP geolocation info (placeholder for production implementation)
 * In production, you might want to integrate with MaxMind GeoIP or similar
 */
export const getIPInfo = (ip: string): { country?: string; city?: string; isVPN?: boolean } => {
  // Production implementation would use a geolocation service
  // For now, return basic info
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return { country: 'Local', city: 'Private Network' };
  }
  
  return {};
};