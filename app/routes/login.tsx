/**
 * Secure login route
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 */

import { useState } from 'react';
import { json, redirect } from '@remix-run/cloudflare';
import { Form, useActionData, useNavigation } from '@remix-run/react';
import type { ActionFunctionArgs, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { createUserSession, getSession } from '~/lib/auth';
import { withSecurityAction } from '~/middleware/security';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Login');

// Mock user database - in production, use a real database
const USERS = {
  admin: {
    id: '1',
    username: 'admin',
    // In production, store hashed passwords only
    passwordHash: 'hashed_password_here',
  },
};

// Maximum failed login attempts before temporary lockout
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Track failed login attempts
const failedAttempts = new Map<string, { count: number, timestamp: number }>();

export async function loader({ request }: LoaderFunctionArgs) {
  const session = await getSession(request);
  const user = session.get('user');
  
  // If user is already logged in, redirect to home
  if (user?.authenticated) {
    return redirect('/');
  }
  
  const url = new URL(request.url);
  const redirectTo = url.searchParams.get('redirectTo') || '/';
  
  return json({ redirectTo });
}

async function loginAction({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string || '/';
  
  // Input validation
  if (!username || !password) {
    return json({ error: 'Username and password are required' }, { status: 400 });
  }
  
  // Get client IP for rate limiting
  const clientIp = request.headers.get('CF-Connecting-IP') || '127.0.0.1';
  const ipKey = `${clientIp}:${username}`;
  
  // Check for account lockout
  const attempts = failedAttempts.get(ipKey);
  if (attempts && attempts.count >= MAX_FAILED_ATTEMPTS) {
    const timeSinceLockout = Date.now() - attempts.timestamp;
    
    if (timeSinceLockout < LOCKOUT_DURATION) {
      const minutesLeft = Math.ceil((LOCKOUT_DURATION - timeSinceLockout) / 60000);
      return json({
        error: `Too many failed login attempts. Please try again in ${minutesLeft} minutes.`
      }, { status: 429 });
    } else {
      // Reset after lockout period
      failedAttempts.delete(ipKey);
    }
  }
  
  // Find user (in production, query your database)
  const user = USERS[username as keyof typeof USERS];
  
  // In production, use a proper password verification
  const isValidPassword = user && password === 'correct_password'; // Simplified for demo
  
  if (!user || !isValidPassword) {
    // Track failed attempt
    const currentAttempts = failedAttempts.get(ipKey) || { count: 0, timestamp: Date.now() };
    currentAttempts.count += 1;
    currentAttempts.timestamp = Date.now();
    failedAttempts.set(ipKey, currentAttempts);
    
    logger.warn(`Failed login attempt for user: ${username}`);
    
    // Don't reveal whether the username exists or password is wrong
    return json({ error: 'Invalid username or password' }, { status: 401 });
  }
  
  // Clear failed attempts on successful login
  failedAttempts.delete(ipKey);
  
  // Create user session
  return createUserSession(user.id, redirectTo);
}

// Apply security middleware
export const action = withSecurityAction(loginAction);

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [showPassword, setShowPassword] = useState(false);
  
  return (
    <div className="flex min-h-full flex-col justify-center">
      <div className="mx-auto w-full max-w-md px-8">
        <h1 className="text-2xl font-bold mb-6">Login</h1>
        
        <Form method="post" className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <div className="mt-1">
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="w-full rounded border border-gray-500 px-2 py-1"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <div className="mt-1 relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                className="w-full rounded border border-gray-500 px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-sm"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {actionData?.error && (
            <div className="text-red-500" role="alert">
              {actionData.error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 focus:bg-blue-400"
          >
            {isSubmitting ? "Logging in..." : "Log in"}
          </button>
        </Form>
      </div>
    </div>
  );
}