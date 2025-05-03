const encoder = new TextEncoder();
const decoder = new TextDecoder();
const IV_LENGTH = 16;
const SALT_LENGTH = 16;
const ITERATIONS = 100000; // Higher iteration count for PBKDF2
const KEY_LENGTH = 256; // Using AES-GCM with 256-bit key

/**
 * Encrypts data with a key using AES-GCM (more secure than AES-CBC)
 * Includes salt for key derivation and authentication tag for integrity
 */
export async function encrypt(key: string, data: string) {
  // Generate random salt and IV
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  
  // Derive a strong key using PBKDF2
  const cryptoKey = await deriveKey(key, salt);

  // Encrypt with AES-GCM (includes authentication)
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
      tagLength: 128, // Authentication tag length
    },
    cryptoKey,
    encoder.encode(data),
  );

  // Combine salt + IV + ciphertext into a single array
  const bundle = new Uint8Array(SALT_LENGTH + IV_LENGTH + ciphertext.byteLength);
  bundle.set(salt, 0);
  bundle.set(iv, SALT_LENGTH);
  bundle.set(new Uint8Array(ciphertext), SALT_LENGTH + IV_LENGTH);

  // Return as base64 string
  return arrayBufferToBase64(bundle);
}

/**
 * Decrypts data that was encrypted with the encrypt function
 */
export async function decrypt(key: string, payload: string) {
  try {
    // Convert base64 string back to array buffer
    const bundle = base64ToArrayBuffer(payload);
    
    // Extract salt, IV, and ciphertext
    const salt = new Uint8Array(bundle.slice(0, SALT_LENGTH));
    const iv = new Uint8Array(bundle.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH));
    const ciphertext = new Uint8Array(bundle.slice(SALT_LENGTH + IV_LENGTH));
    
    // Derive the same key using the stored salt
    const cryptoKey = await deriveKey(key, salt);

    // Decrypt with AES-GCM (automatically verifies authentication tag)
    const plaintext = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv,
        tagLength: 128,
      },
      cryptoKey,
      ciphertext,
    );

    return decoder.decode(plaintext);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data. The key may be incorrect or the data may have been tampered with.');
  }
}

/**
 * Derives a cryptographic key from a password and salt using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array) {
  // First, create a key from the password
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  // Then derive a key suitable for AES-GCM
  return await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Converts an ArrayBuffer to a Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const binString = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  return btoa(binString);
}

/**
 * Converts a Base64 string to an ArrayBuffer
 */
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binString = atob(base64);
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return bytes.buffer;
}
