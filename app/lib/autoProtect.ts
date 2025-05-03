/**
 * Automatic Protection System
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 * Contact: radosavlevici.ervin@gmail.com
 * 
 * This file implements automatic protection mechanisms that run without user intervention.
 */

import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('AutoProtect');

// Configuration
const protectionConfig = {
  owner: 'Ervin Remus Radosavlevici',
  email: 'radosavlevici.ervin@gmail.com',
  autoReportEnabled: true,
  autoBlockEnabled: true,
  fingerprintEnabled: true,
  autoRecoveryEnabled: true,
};

// Initialize protection system
let isInitialized = false;

/**
 * Initialize the automatic protection system
 * This runs automatically when the file is imported
 */
export async function initializeProtection(): Promise<void> {
  if (isInitialized) return;
  
  try {
    logger.info('Initializing automatic protection system');
    
    // Register protection mechanisms
    registerFingerprintProtection();
    registerMutationObserver();
    registerNetworkMonitoring();
    registerPeriodicChecks();
    
    isInitialized = true;
    logger.info('Automatic protection system initialized');
  } catch (error) {
    logger.error('Failed to initialize protection system:', error);
  }
}

/**
 * Register fingerprint protection to identify the application
 */
function registerFingerprintProtection(): void {
  if (!protectionConfig.fingerprintEnabled || typeof window === 'undefined') return;
  
  try {
    // Add hidden fingerprint elements
    setTimeout(() => {
      const fingerprint = document.createElement('div');
      fingerprint.id = 'ervin-remus-radosavlevici-fingerprint';
      fingerprint.style.display = 'none';
      fingerprint.setAttribute('data-owner', protectionConfig.owner);
      fingerprint.setAttribute('data-email', protectionConfig.email);
      fingerprint.setAttribute('data-protected', 'true');
      document.body.appendChild(fingerprint);
      
      // Add metadata
      const meta = document.createElement('meta');
      meta.name = 'copyright';
      meta.content = `Copyright (c) 2024 ${protectionConfig.owner}. All rights reserved.`;
      document.head.appendChild(meta);
      
      // Add HTML comment fingerprint
      const comment = document.createComment(
        `Protected code: Copyright (c) 2024 ${protectionConfig.owner}. All rights reserved.`
      );
      document.documentElement.appendChild(comment);
    }, 1000);
  } catch (error) {
    logger.error('Failed to register fingerprint protection:', error);
  }
}

/**
 * Register mutation observer to detect tampering with protection elements
 */
function registerMutationObserver(): void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return;
  
  try {
    setTimeout(() => {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            // Check if protection elements were removed
            const removedNodes = Array.from(mutation.removedNodes);
            const protectionRemoved = removedNodes.some(node => {
              if (node instanceof HTMLElement) {
                return node.id === 'ervin-remus-radosavlevici-fingerprint' || 
                       node.classList.contains('copyright-protection');
              }
              return false;
            });
            
            if (protectionRemoved && protectionConfig.autoBlockEnabled) {
              logger.warn('Protection elements removed - activating protection response');
              activateProtectionResponse('tampering_detected');
            }
          }
        }
      });
      
      // Start observing the document
      observer.observe(document.body, { 
        childList: true,
        subtree: true
      });
    }, 2000);
  } catch (error) {
    logger.error('Failed to register mutation observer:', error);
  }
}

/**
 * Monitor network requests to detect unauthorized API usage
 */
function registerNetworkMonitoring(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Override fetch to monitor requests
    const originalFetch = window.fetch;
    window.fetch = async function(input, init) {
      try {
        // Add copyright headers to outgoing requests
        if (init && !init.headers) {
          init.headers = {};
        }
        
        if (init && init.headers) {
          const headers = init.headers as Record<string, string>;
          headers['X-Protected-By'] = protectionConfig.owner;
          headers['X-Copyright'] = `Copyright (c) 2024 ${protectionConfig.owner}`;
        }
        
        // Monitor for suspicious API calls
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/api/') || url.includes('/graphql')) {
          logger.info(`API request to: ${url}`);
        }
        
        return await originalFetch.apply(this, [input, init]);
      } catch (error) {
        logger.error('Error in network monitoring:', error);
        return await originalFetch.apply(this, [input, init]);
      }
    };
  } catch (error) {
    logger.error('Failed to register network monitoring:', error);
  }
}

/**
 * Run periodic checks to ensure protection is active
 */
function registerPeriodicChecks(): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Check every 30 seconds
    setInterval(() => {
      // Verify fingerprint exists
      const fingerprint = document.getElementById('ervin-remus-radosavlevici-fingerprint');
      if (!fingerprint && protectionConfig.autoRecoveryEnabled) {
        logger.warn('Protection fingerprint missing - restoring');
        registerFingerprintProtection();
      }
      
      // Verify copyright notice in console periodically
      console.info(
        '%c© 2024 Ervin Remus Radosavlevici. All rights reserved.',
        'font-weight: bold; color: #ff0000;'
      );
      
    }, 30000);
  } catch (error) {
    logger.error('Failed to register periodic checks:', error);
  }
}

/**
 * Activate protection response when tampering is detected
 */
function activateProtectionResponse(reason: string): void {
  try {
    // Log the incident
    logger.error(`Protection violation detected: ${reason}`);
    
    // Display warning
    const warning = document.createElement('div');
    warning.style.position = 'fixed';
    warning.style.top = '0';
    warning.style.left = '0';
    warning.style.width = '100%';
    warning.style.padding = '20px';
    warning.style.backgroundColor = 'red';
    warning.style.color = 'white';
    warning.style.fontWeight = 'bold';
    warning.style.textAlign = 'center';
    warning.style.zIndex = '999999';
    warning.textContent = 'UNAUTHORIZED USE DETECTED: This software is protected by copyright law.';
    document.body.appendChild(warning);
    
    // Report the incident if enabled
    if (protectionConfig.autoReportEnabled) {
      reportViolation(reason);
    }
    
    // Block functionality if enabled
    if (protectionConfig.autoBlockEnabled) {
      // Disable key functionality
      disableFunctionality();
    }
  } catch (error) {
    logger.error('Failed to activate protection response:', error);
  }
}

/**
 * Report copyright violation
 */
async function reportViolation(reason: string): Promise<void> {
  try {
    // In a real implementation, this would report to a monitoring service
    // For now, we'll just log the violation
    logger.warn(`Copyright violation: ${reason}`);
    logger.warn(`Owner: ${protectionConfig.owner}`);
    logger.warn(`Contact: ${protectionConfig.email}`);
    
    // Get location information for the report
    const locationInfo = {
      url: window.location.href,
      hostname: window.location.hostname,
      timestamp: new Date().toISOString()
    };
    
    logger.warn(`Location: ${JSON.stringify(locationInfo)}`);
  } catch (error) {
    logger.error('Failed to report violation:', error);
  }
}

/**
 * Disable key functionality when tampering is detected
 */
function disableFunctionality(): void {
  try {
    // Add visible watermarks
    setInterval(() => {
      const watermark = document.createElement('div');
      watermark.style.position = 'fixed';
      watermark.style.top = `${Math.random() * 100}%`;
      watermark.style.left = `${Math.random() * 100}%`;
      watermark.style.transform = 'translate(-50%, -50%)';
      watermark.style.fontSize = '24px';
      watermark.style.color = 'rgba(255, 0, 0, 0.7)';
      watermark.style.fontWeight = 'bold';
      watermark.style.pointerEvents = 'none';
      watermark.style.zIndex = '9999';
      watermark.style.textShadow = '1px 1px 2px rgba(0,0,0,0.5)';
      watermark.textContent = '© Ervin Remus Radosavlevici';
      document.body.appendChild(watermark);
      
      // Remove after 10 seconds
      setTimeout(() => {
        if (watermark.parentNode) {
          watermark.parentNode.removeChild(watermark);
        }
      }, 10000);
    }, 5000);
    
    // Disable right-click to prevent easy copying
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      alert('This content is protected by copyright law.\nCopyright (c) 2024 Ervin Remus Radosavlevici\nAll rights reserved.');
      return false;
    });
    
    // Disable keyboard shortcuts for copying
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 's')) {
        e.preventDefault();
        alert('This content is protected by copyright law.\nCopyright (c) 2024 Ervin Remus Radosavlevici\nAll rights reserved.');
        return false;
      }
    });
  } catch (error) {
    logger.error('Failed to disable functionality:', error);
  }
}

// Initialize protection automatically
initializeProtection().catch(error => {
  logger.error('Failed to initialize automatic protection:', error);
});

// Export for explicit initialization if needed
export default {
  initialize: initializeProtection,
  config: protectionConfig
};