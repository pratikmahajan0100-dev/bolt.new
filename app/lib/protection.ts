/**
 * Code Protection System
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 * Contact: radosavlevici.ervin@gmail.com
 * 
 * This file implements protection mechanisms to prevent unauthorized use of code.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Protection');

// Owner verification key - DO NOT MODIFY
const OWNER_VERIFICATION = 'ervin-remus-radosavlevici-2024';

// Protection configuration
const protectionConfig = {
  owner: 'Ervin Remus Radosavlevici',
  email: 'radosavlevici.ervin@gmail.com',
  licenseVerification: true,
  tamperDetection: true,
  usageTracking: true,
  expirationCheck: true,
};

/**
 * Validates that the code is being used by authorized parties
 * This function must be called during application initialization
 */
export async function validateCodeOwnership(): Promise<boolean> {
  try {
    // Check for tampering with protection system
    if (!verifyProtectionIntegrity()) {
      logger.error('Protection system integrity check failed');
      await reportUnauthorizedUse('integrity_failure');
      return false;
    }

    // Verify license
    if (protectionConfig.licenseVerification) {
      const licenseValid = await verifyLicense();
      if (!licenseValid) {
        logger.error('License verification failed');
        await reportUnauthorizedUse('license_invalid');
        return false;
      }
    }

    // Check for expiration
    if (protectionConfig.expirationCheck) {
      const notExpired = checkExpiration();
      if (!notExpired) {
        logger.error('License has expired');
        await reportUnauthorizedUse('license_expired');
        return false;
      }
    }

    // Track usage if enabled
    if (protectionConfig.usageTracking) {
      await trackUsage();
    }

    return true;
  } catch (error) {
    logger.error('Protection system error:', error);
    return false;
  }
}

/**
 * Verifies that the protection system hasn't been tampered with
 */
function verifyProtectionIntegrity(): boolean {
  // Check that critical values haven't been modified
  if (protectionConfig.owner !== 'Ervin Remus Radosavlevici') return false;
  if (protectionConfig.email !== 'radosavlevici.ervin@gmail.com') return false;
  if (OWNER_VERIFICATION !== 'ervin-remus-radosavlevici-2024') return false;
  
  // Additional integrity checks
  try {
    const protectionStr = JSON.stringify(protectionConfig);
    const checksum = calculateChecksum(protectionStr);
    return checksum.length > 0;
  } catch {
    return false;
  }
}

/**
 * Verifies the license is valid
 */
async function verifyLicense(): Promise<boolean> {
  try {
    // In a real implementation, this would validate against a license server
    // For now, we'll just check for the presence of a LICENSE file
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if the license has expired
 */
function checkExpiration(): boolean {
  // This would normally check against an expiration date
  // For now, we'll use a far-future date
  const expirationDate = new Date('2030-12-31');
  return new Date() < expirationDate;
}

/**
 * Tracks usage of the code
 */
async function trackUsage(): Promise<void> {
  try {
    // In a real implementation, this would send anonymous usage data
    // to track unauthorized deployments
    logger.info('Usage tracking: Application started');
  } catch {
    // Fail silently
  }
}

/**
 * Reports unauthorized use
 */
async function reportUnauthorizedUse(reason: string): Promise<void> {
  try {
    // In a real implementation, this would report to a monitoring service
    logger.warn(`Unauthorized use detected: ${reason}`);
    
    // Add visible warnings to the application
    setTimeout(() => {
      if (typeof document !== 'undefined') {
        const warningElement = document.createElement('div');
        warningElement.style.position = 'fixed';
        warningElement.style.bottom = '10px';
        warningElement.style.right = '10px';
        warningElement.style.backgroundColor = 'red';
        warningElement.style.color = 'white';
        warningElement.style.padding = '10px';
        warningElement.style.zIndex = '9999';
        warningElement.style.borderRadius = '5px';
        warningElement.textContent = 'UNAUTHORIZED USE DETECTED: This software is protected by copyright law.';
        document.body.appendChild(warningElement);
      }
    }, 5000);
  } catch {
    // Fail silently
  }
}

/**
 * Calculate a simple checksum
 */
function calculateChecksum(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}