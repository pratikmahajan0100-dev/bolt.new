import { encrypt, decrypt } from '~/lib/crypto';
import { createScopedLogger } from './logger';

const logger = createScopedLogger('SecureStorage');

/**
 * SecureStorage provides encrypted local storage functionality
 * to protect sensitive data stored in the browser
 */
export class SecureStorage {
  private readonly prefix: string;
  private readonly encryptionKey: string;
  
  /**
   * Create a new SecureStorage instance
   * @param namespace - Namespace to prefix all keys with
   * @param encryptionKey - Key used for encryption (should be a strong, unique key)
   */
  constructor(namespace: string, encryptionKey: string) {
    this.prefix = `secure_${namespace}_`;
    this.encryptionKey = encryptionKey;
  }
  
  /**
   * Store a value securely
   * @param key - Storage key
   * @param value - Value to store (will be encrypted)
   */
  async setItem(key: string, value: any): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = await encrypt(this.encryptionKey, serialized);
      localStorage.setItem(this.prefix + key, encrypted);
    } catch (error) {
      logger.error('Failed to securely store item:', error);
      throw new Error('Failed to securely store data');
    }
  }
  
  /**
   * Retrieve and decrypt a stored value
   * @param key - Storage key
   * @returns The decrypted value or null if not found
   */
  async getItem<T>(key: string): Promise<T | null> {
    try {
      const encrypted = localStorage.getItem(this.prefix + key);
      
      if (!encrypted) {
        return null;
      }
      
      const decrypted = await decrypt(this.encryptionKey, encrypted);
      return JSON.parse(decrypted) as T;
    } catch (error) {
      logger.error('Failed to retrieve secure item:', error);
      // If decryption fails, remove the corrupted item
      this.removeItem(key);
      return null;
    }
  }
  
  /**
   * Remove a stored value
   * @param key - Storage key to remove
   */
  removeItem(key: string): void {
    localStorage.removeItem(this.prefix + key);
  }
  
  /**
   * Clear all values stored in this namespace
   */
  clear(): void {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    }
  }
  
  /**
   * Get all keys in this namespace
   * @returns Array of keys (without the namespace prefix)
   */
  keys(): string[] {
    const keys: string[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length));
      }
    }
    
    return keys;
  }
}

/**
 * Create a secure storage instance with a derived key
 * @param namespace - Storage namespace
 * @param userIdentifier - User-specific identifier to derive the key
 */
export function createSecureStorage(namespace: string, userIdentifier: string): SecureStorage {
  // Derive a deterministic key from the user identifier
  // In production, this should be combined with a server-provided secret
  const derivedKey = deriveKeyFromIdentifier(userIdentifier);
  return new SecureStorage(namespace, derivedKey);
}

/**
 * Derive a deterministic key from a user identifier
 * This is a simplified version - in production use a more robust approach
 */
function deriveKeyFromIdentifier(identifier: string): string {
  // Simple key derivation - in production use a more secure approach
  // This is just to demonstrate the concept
  const encoder = new TextEncoder();
  const data = encoder.encode(identifier);
  
  // Create a simple hash of the identifier
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash) + data[i];
    hash |= 0; // Convert to 32bit integer
  }
  
  // Convert to a string and pad
  return hash.toString(36).padStart(16, '0');
}