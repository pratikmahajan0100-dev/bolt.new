/**
 * Authentication system
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 */

import { createCookieSessionStorage, redirect } from '@remix-run/cloudflare';
import { createScopedLogger } from '~/utils/logger';

const logger = createScopedLogger('Auth');

// Session duration (24 hours)
const SESSION_EXPIRY = 60 * 60 * 24;

// Create session storage
export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'bolt_session',
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'default-secret-change-me'],
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_EXPIRY,
  },
});

// Get session from request
export async function getSession(request: Request) {
  const cookie = request.headers.get('Cookie');
  return sessionStorage.getSession(cookie);
}

// User session data type
export type UserSession = {
  userId: string;
  authenticated: boolean;
  lastActivity: number;
};

// Create a new session
export async function createUserSession(userId: string, redirectTo: string) {
  const session = await sessionStorage.getSession();
  
  const userSession: UserSession = {
    userId,
    authenticated: true,
    lastActivity: Date.now(),
  };
  
  session.set('user', userSession);
  
  return redirect(redirectTo, {
    headers: {
      'Set-Cookie': await sessionStorage.commitSession(session),
    },
  });
}

// Get user from session
export async function getUserFromSession(request: Request): Promise<UserSession | null> {
  const session = await getSession(request);
  const userSession = session.get('user') as UserSession | undefined;
  
  if (!userSession || !userSession.authenticated) {
    return null;
  }
  
  // Check for session expiry (inactivity timeout)
  const now = Date.now();
  const inactiveTime = now - userSession.lastActivity;
  if (inactiveTime > SESSION_EXPIRY * 1000) {
    logger.info('Session expired due to inactivity');
    await logout(request);
    return null;
  }
  
  // Update last activity time
  userSession.lastActivity = now;
  session.set('user', userSession);
  
  return userSession;
}

// Require authentication
export async function requireAuth(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const user = await getUserFromSession(request);
  
  if (!user) {
    const searchParams = new URLSearchParams([['redirectTo', redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  return user;
}

// Logout
export async function logout(request: Request) {
  const session = await getSession(request);
  
  return redirect('/', {
    headers: {
      'Set-Cookie': await sessionStorage.destroySession(session),
    },
  });
}

// Generate a secure random token
export function generateSecureToken(length = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}