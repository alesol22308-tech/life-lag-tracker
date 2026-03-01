'use client';

import { useEffect, useRef } from 'react';

export default function ServiceWorkerRegistration() {
  // Only reload on controllerchange when we requested the update (SKIP_WAITING), not on every change
  const pendingReloadRef = useRef(false);

  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) console.log('🔧 ServiceWorkerRegistration component mounted');

    if (typeof window === 'undefined') {
      if (isDev) console.log('   Skipping: window is undefined (SSR)');
      return;
    }

    // Check if service workers are supported
    if (!('serviceWorker' in navigator)) {
      if (isDev) console.warn('⚠️ Service Workers are not supported in this browser');
      return;
    }

    if (isDev) console.log('✅ Service Workers are supported, proceeding with registration...');

    async function registerServiceWorker() {
      try {
        // First, unregister all existing service workers to start fresh
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const registration of registrations) {
          if (isDev) console.log('Unregistering old service worker:', registration.scope);
          await registration.unregister();
        }

        // Wait a moment for unregistration to complete
        await new Promise(resolve => setTimeout(resolve, 100));

        // Register the new service worker
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none' // Always check for updates
        });

        if (isDev) {
          console.log('✅ Service Worker registered successfully!');
          console.log('   Scope:', registration.scope);
        }

        // Force activation if there's a waiting worker (only on fresh register)
        if (registration.waiting) {
          if (isDev) console.log('   Activating waiting service worker...');
          pendingReloadRef.current = true;
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }

        // Check current state
        if (registration.installing) {
          if (isDev) console.log('   Status: Installing...');
          registration.installing.addEventListener('statechange', (e) => {
            const worker = e.target as ServiceWorker;
            if (isDev) console.log(`   Worker state changed to: ${worker.state}`);
            if (worker.state === 'activated') {
              if (isDev) console.log('   ✅ Service Worker activated!');
              if (pendingReloadRef.current) {
                window.location.reload();
              }
            }
          });
        } else if (registration.waiting) {
          if (isDev) console.log('   Status: Waiting - attempting to activate...');
          pendingReloadRef.current = true;
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          setTimeout(() => {
            if (registration.active && pendingReloadRef.current) {
              window.location.reload();
            }
          }, 1000);
        } else if (registration.active) {
          if (isDev) console.log('   Status: ✅ Active and controlling');
        }

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            if (isDev) console.log('   New service worker found, installing...');
            newWorker.addEventListener('statechange', () => {
              if (isDev) console.log(`   New worker state: ${newWorker.state}`);
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  if (isDev) console.log('   New service worker ready - activating...');
                  pendingReloadRef.current = true;
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                } else if (isDev) {
                  console.log('   New service worker activated immediately');
                }
              }
            });
          }
        });

        // Periodically check for updates
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      } catch (error) {
        if (isDev) {
          console.error('❌ Service Worker registration failed:', error);
          console.error('   Error details:', error instanceof Error ? error.message : String(error));
          console.error('   Make sure you are running in production mode (npm start, not npm run dev)');
        }
      }
    }

    // Only reload when we requested the update (skipWaiting), not on every controller change (e.g. other tab)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (pendingReloadRef.current) {
        if (isDev) console.log('🔄 Service Worker controller changed (we requested update) - reloading page');
        window.location.reload();
      } else if (isDev) {
        console.log('🔄 Service Worker controller changed (ignored - we did not request update)');
      }
    });

    // Check if service worker is already controlling the page
    if (navigator.serviceWorker.controller) {
      if (isDev) {
        console.log('✅ Service Worker is already controlling this page');
        console.log('   Controller script URL:', navigator.serviceWorker.controller.scriptURL);
      }
    } else {
      // Register if not already controlling
      registerServiceWorker();
    }
  }, []);

  return null;
}
