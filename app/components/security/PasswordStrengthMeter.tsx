/**
 * Password strength meter component
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 */

import { useState, useEffect } from 'react';

interface PasswordStrengthMeterProps {
  password: string;
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    // Calculate password strength
    const calculateStrength = (pwd: string) => {
      if (!pwd) {
        setStrength(0);
        setFeedback('');
        return;
      }

      let score = 0;
      
      // Length check
      if (pwd.length >= 8) score += 1;
      if (pwd.length >= 12) score += 1;
      
      // Complexity checks
      if (/[A-Z]/.test(pwd)) score += 1; // Has uppercase
      if (/[a-z]/.test(pwd)) score += 1; // Has lowercase
      if (/[0-9]/.test(pwd)) score += 1; // Has number
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1; // Has special char
      
      // Variety check
      const uniqueChars = new Set(pwd.split('')).size;
      if (uniqueChars > pwd.length * 0.7) score += 1;
      
      // Common patterns check (reduce score)
      if (/^123|password|admin|qwerty|welcome/i.test(pwd)) score -= 2;
      
      // Normalize score to 0-4 range
      const normalizedScore = Math.max(0, Math.min(4, score));
      
      setStrength(normalizedScore);
      
      // Set feedback based on score
      switch (normalizedScore) {
        case 0:
          setFeedback('Very weak');
          break;
        case 1:
          setFeedback('Weak - Add more characters and variety');
          break;
        case 2:
          setFeedback('Fair - Consider adding special characters');
          break;
        case 3:
          setFeedback('Good - Password has decent strength');
          break;
        case 4:
          setFeedback('Strong - Excellent password strength');
          break;
        default:
          setFeedback('');
      }
    };
    
    calculateStrength(password);
  }, [password]);
  
  // Determine color based on strength
  const getColor = () => {
    switch (strength) {
      case 0: return 'bg-gray-300';
      case 1: return 'bg-red-500';
      case 2: return 'bg-orange-500';
      case 3: return 'bg-yellow-500';
      case 4: return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };
  
  // Skip rendering if no password
  if (!password) return null;
  
  return (
    <div className="mt-2">
      <div className="flex gap-1 h-1 mb-1">
        {[...Array(4)].map((_, i) => (
          <div 
            key={i}
            className={`h-full flex-1 rounded-sm ${i < strength ? getColor() : 'bg-gray-200'}`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-600">{feedback}</p>
    </div>
  );
}