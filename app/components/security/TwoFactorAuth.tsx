/**
 * Two-factor authentication component
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 */

import { useState } from 'react';

interface TwoFactorAuthProps {
  onVerify: (code: string) => Promise<boolean>;
  onCancel: () => void;
}

export default function TwoFactorAuth({ onVerify, onCancel }: TwoFactorAuthProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  
  // Handle input change for each digit
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`2fa-input-${index + 1}`);
      nextInput?.focus();
    }
    
    // Clear error when typing
    if (error) setError('');
  };
  
  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`2fa-input-${index - 1}`);
      prevInput?.focus();
    }
  };
  
  // Handle paste event to fill all inputs
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').trim();
    
    // Check if pasted content is a valid 6-digit code
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setCode(digits);
      
      // Focus the last input
      const lastInput = document.getElementById('2fa-input-5');
      lastInput?.focus();
    }
  };
  
  // Handle verification
  const handleVerify = async () => {
    const fullCode = code.join('');
    
    // Validate code format
    if (fullCode.length !== 6 || !/^\d{6}$/.test(fullCode)) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    
    setIsVerifying(true);
    setError('');
    
    try {
      const isValid = await onVerify(fullCode);
      
      if (!isValid) {
        setError('Invalid verification code. Please try again.');
        setCode(['', '', '', '', '', '']);
        // Focus first input
        document.getElementById('2fa-input-0')?.focus();
      }
    } catch (err) {
      setError('An error occurred during verification. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };
  
  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Two-Factor Authentication</h2>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        Enter the 6-digit code from your authenticator app
      </p>
      
      <div className="flex justify-center gap-2 mb-6">
        {code.map((digit, index) => (
          <input
            key={index}
            id={`2fa-input-${index}`}
            type="text"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
            className="w-12 h-12 text-center text-xl border rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            autoFocus={index === 0}
          />
        ))}
      </div>
      
      {error && (
        <div className="text-red-500 text-center mb-4" role="alert">
          {error}
        </div>
      )}
      
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100"
          disabled={isVerifying}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleVerify}
          disabled={code.join('').length !== 6 || isVerifying}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
        >
          {isVerifying ? 'Verifying...' : 'Verify'}
        </button>
      </div>
    </div>
  );
}