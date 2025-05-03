/**
 * Root application component
 * Copyright (c) 2024 Ervin Remus Radosavlevici
 * All rights reserved.
 * Contact: radosavlevici.ervin@gmail.com
 */

import { useStore } from '@nanostores/react';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/cloudflare';
import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from '@remix-run/react';
import tailwindReset from '@unocss/reset/tailwind-compat.css?url';
import { themeStore } from './lib/stores/theme';
import { stripIndents } from './utils/stripIndent';
import { createHead } from 'remix-island';
import { useEffect } from 'react';
import { getUserFromSession } from './lib/auth';
import { applySecurityHeaders } from './middleware/security';
import { json } from '@remix-run/cloudflare';
import { ToastContainer } from 'react-toastify';
import { validateCodeOwnership } from './lib/protection';
import './lib/autoProtect'; // Import automatic protection system

import reactToastifyStyles from 'react-toastify/dist/ReactToastify.css?url';
import globalStyles from './styles/index.scss?url';
import xtermStyles from '@xterm/xterm/css/xterm.css?url';

import 'virtual:uno.css';

export const links: LinksFunction = () => [
  {
    rel: 'icon',
    href: '/favicon.svg',
    type: 'image/svg+xml',
  },
  { rel: 'stylesheet', href: reactToastifyStyles },
  { rel: 'stylesheet', href: tailwindReset },
  { rel: 'stylesheet', href: globalStyles },
  { rel: 'stylesheet', href: xtermStyles },
  {
    rel: 'preconnect',
    href: 'https://fonts.googleapis.com',
  },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

const inlineThemeCode = stripIndents`
  setTutorialKitTheme();

  function setTutorialKitTheme() {
    let theme = localStorage.getItem('bolt_theme');

    if (!theme) {
      theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    document.querySelector('html')?.setAttribute('data-theme', theme);
  }
`;

export const Head = createHead(() => (
  <>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <Meta />
    <Links />
    <script dangerouslySetInnerHTML={{ __html: inlineThemeCode }} />
  </>
));

export function Layout({ children }: { children: React.ReactNode }) {
  const theme = useStore(themeStore);

  useEffect(() => {
    document.querySelector('html')?.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <>
      {children}
      <ScrollRestoration />
      <Scripts />
    </>
  );
}

export async function loader({ request }: LoaderFunctionArgs) {
  // Get user from session if available
  const user = await getUserFromSession(request);
  
  // Validate code ownership
  const ownershipValid = await validateCodeOwnership();
  
  // Return user data and apply security headers
  return applySecurityHeaders(
    json({
      user: user ? { id: user.userId, authenticated: user.authenticated } : null,
      ownershipValid,
      copyrightOwner: 'Ervin Remus Radosavlevici',
      contactEmail: 'radosavlevici.ervin@gmail.com',
    })
  );
}

export default function App() {
  const { user, ownershipValid } = useLoaderData<typeof loader>();
  
  useEffect(() => {
    // Add copyright notice to console
    console.info(
      '%c© 2024 Ervin Remus Radosavlevici. All rights reserved.',
      'font-weight: bold; color: #ff0000;'
    );
    
    // Add watermark to the application
    const addWatermark = () => {
      if (typeof document !== 'undefined') {
        const watermark = document.createElement('div');
        watermark.style.position = 'fixed';
        watermark.style.bottom = '5px';
        watermark.style.right = '5px';
        watermark.style.fontSize = '10px';
        watermark.style.color = 'rgba(100, 100, 100, 0.5)';
        watermark.style.zIndex = '9999';
        watermark.style.pointerEvents = 'none';
        watermark.textContent = '© 2024 Ervin Remus Radosavlevici';
        document.body.appendChild(watermark);
      }
    };
    
    // Show warning if ownership validation fails
    if (!ownershipValid) {
      console.error('UNAUTHORIZED USE DETECTED: This software is protected by copyright law.');
    }
    
    addWatermark();
  }, [ownershipValid]);
  
  return (
    <>
      <Outlet context={{ user }} />
      <ToastContainer position="bottom-right" />
      {!ownershipValid && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-600 text-white p-2 text-center">
          UNAUTHORIZED USE DETECTED: This software is protected by copyright law.
          Contact: radosavlevici.ervin@gmail.com
        </div>
      )}
    </>
  );
}
