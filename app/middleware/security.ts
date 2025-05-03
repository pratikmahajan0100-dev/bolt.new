import type { LoaderFunctionArgs, ActionFunctionArgs } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('SecurityMiddleware');

// Security headers to protect against common web vulnerabilities
const securityHeaders = {
  'Content-Security-Policy': 
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self'; " +
    "connect-src 'self' https://*.anthropic.com; " +
    "frame-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self';",
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

// Rate limiting configuration
const rateLimits = new Map<string, { count: number, timestamp: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // Maximum requests per window

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers);
  
  // Add security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    headers.set(key, value);
  });
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}

/**
 * Check rate limiting based on IP address
 */
function checkRateLimit(request: Request): boolean {
  // Get client IP (in production, use CF-Connecting-IP header)
  const ip = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const now = Date.now();
  
  // Get or create rate limit entry
  let rateLimit = rateLimits.get(ip);
  if (!rateLimit || (now - rateLimit.timestamp > RATE_LIMIT_WINDOW)) {
    rateLimit = { count: 0, timestamp: now };
  }
  
  // Increment count
  rateLimit.count++;
  rateLimits.set(ip, rateLimit);
  
  // Check if rate limit exceeded
  if (rateLimit.count > RATE_LIMIT_MAX) {
    logger.warn(`Rate limit exceeded for IP: ${ip}`);
    return false;
  }
  
  return true;
}

/**
 * Security middleware for loaders
 */
export function withSecurity<LoaderData>(
  loader: (args: LoaderFunctionArgs) => Promise<Response>
): (args: LoaderFunctionArgs) => Promise<Response> {
  return async (args) => {
    try {
      // Check rate limiting
      if (!checkRateLimit(args.request)) {
        return new Response('Too Many Requests', { status: 429 });
      }
      
      // Run the original loader
      const response = await loader(args);
      
      // Apply security headers
      return applySecurityHeaders(response);
    } catch (error) {
      logger.error('Security middleware error:', error);
      throw error;
    }
  };
}

/**
 * Security middleware for actions
 */
export function withSecurityAction<ActionData>(
  action: (args: ActionFunctionArgs) => Promise<Response>
): (args: ActionFunctionArgs) => Promise<Response> {
  return async (args) => {
    try {
      // Check rate limiting
      if (!checkRateLimit(args.request)) {
        return new Response('Too Many Requests', { status: 429 });
      }
      
      // Run the original action
      const response = await action(args);
      
      // Apply security headers
      return applySecurityHeaders(response);
    } catch (error) {
      logger.error('Security middleware error:', error);
      throw error;
    }
  };
}