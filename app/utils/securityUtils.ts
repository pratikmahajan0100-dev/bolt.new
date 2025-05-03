/**
 * Security utility functions
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 */

import { createScopedLogger } from './logger';

const logger = createScopedLogger('SecurityUtils');

/**
 * Sanitize user input to prevent XSS attacks
 * @param input - User input string to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if email format is valid
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Generate a secure random token
 * @param length - Length of the token
 * @returns Random token string
 */
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Check if a password meets security requirements
 * @param password - Password to check
 * @returns Object with validation result and feedback
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  feedback: string;
} {
  if (!password) {
    return { isValid: false, feedback: 'Password is required' };
  }
  
  if (password.length < 8) {
    return { isValid: false, feedback: 'Password must be at least 8 characters long' };
  }
  
  // Check for complexity requirements
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /[0-9]/.test(password);
  const hasSpecialChars = /[^A-Za-z0-9]/.test(password);
  
  const requirementsMet = [hasUppercase, hasLowercase, hasNumbers, hasSpecialChars]
    .filter(Boolean).length;
  
  if (requirementsMet < 3) {
    return { 
      isValid: false, 
      feedback: 'Password must contain at least 3 of the following: uppercase letters, lowercase letters, numbers, and special characters' 
    };
  }
  
  // Check for common passwords
  const commonPasswords = [
    'password', 'admin', '123456', 'qwerty', 'welcome', 
    'letmein', 'monkey', 'password123', 'abc123'
  ];
  
  if (commonPasswords.some(common => 
    password.toLowerCase().includes(common.toLowerCase()))) {
    return { 
      isValid: false, 
      feedback: 'Password contains common words that are easily guessed' 
    };
  }
  
  return { isValid: true, feedback: 'Password meets security requirements' };
}

/**
 * Detect potential security threats in user input
 * @param input - User input to analyze
 * @returns True if potential threat detected
 */
export function detectSecurityThreats(input: string): boolean {
  if (!input) return false;
  
  // Check for common SQL injection patterns
  const sqlInjectionPatterns = [
    /'\s*OR\s*'1'\s*=\s*'1/i,
    /'\s*OR\s*1\s*=\s*1/i,
    /'\s*;\s*DROP\s+TABLE/i,
    /'\s*;\s*DELETE\s+FROM/i,
    /UNION\s+SELECT/i
  ];
  
  // Check for common XSS patterns
  const xssPatterns = [
    /<script>/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i
  ];
  
  // Check for path traversal attempts
  const pathTraversalPatterns = [
    /\.\.\//,
    /\.\.\\\\/ 
  ];
  
  const allPatterns = [
    ...sqlInjectionPatterns,
    ...xssPatterns,
    ...pathTraversalPatterns
  ];
  
  const threatDetected = allPatterns.some(pattern => pattern.test(input));
  
  if (threatDetected) {
    logger.warn('Security threat detected in user input');
  }
  
  return threatDetected;
}

/**
 * Create a Content Security Policy header value
 * @returns CSP header value
 */
export function generateCSP(): string {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://*.anthropic.com",
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; ');
}