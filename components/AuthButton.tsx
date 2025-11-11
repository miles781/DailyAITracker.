'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/appState';
import { db, type User } from '../lib/db';
import { encryptionService } from '../lib/encrypt';

// Google OAuth type declarations
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: GoogleTokenClientConfig) => GoogleTokenClient;
          revoke: (token: string, callback?: () => void) => void;
        };
      };
    };
  }
}

interface GoogleTokenClientConfig {
  client_id: string;
  scope: string;
  callback: (response: GoogleTokenResponse) => void;
}

interface GoogleTokenClient {
  requestAccessToken: () => void;
}

interface GoogleTokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface GoogleUserInfo {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
}

interface AuthError extends Error {
  code?: string;
  details?: string;
}

export default function AuthButton(): JSX.Element {
  const { user, setUser, setIsLoading, loadUserData } = useAppStore();
  const [isClient, setIsClient] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    
    // Load Google Identity Services dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    
    const handleScriptLoad = (): void => {
      setScriptLoaded(true);
    };

    script.addEventListener('load', handleScriptLoad);
    document.head.appendChild(script);

    return () => {
      script.removeEventListener('load', handleScriptLoad);
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const handleAuthSuccess = useCallback(async (userInfo: GoogleUserInfo): Promise<void> => {
    setIsLoading(true);
    
    try {
      // Create or get user
      let existingUser: User | undefined = await db.users.where('googleId').equals(userInfo.sub).first();
      
        if (!existingUser) {
        // Generate encryption key for new user
        const encryptionKey: CryptoKey = await encryptionService.generateKey();
        const exportedKey: ArrayBuffer = await encryptionService.exportKey(encryptionKey);
        
        // Convert ArrayBuffer to base64 string properly
        const exportedKeyUint8: Uint8Array = new Uint8Array(exportedKey);
        const encryptedKey: string = btoa(String.fromCharCode(...exportedKeyUint8));
        
        encryptionService.setUserKey(encryptionKey);

        const newUser: User = {
          id: crypto.randomUUID(),
          googleId: userInfo.sub,
          encryptedKey,
          // store basic profile info for display
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
          createdAt: new Date(),
        };

        await db.users.add(newUser);
        existingUser = newUser;
      } else {
        // Import existing key - Fix ArrayBuffer conversion
        const keyBuffer: Uint8Array = Uint8Array.from(
          atob(existingUser.encryptedKey), 
          (c: string): number => c.charCodeAt(0)
        );
        
        // Create a new ArrayBuffer copy from the Uint8Array (ensures a plain ArrayBuffer type)
        // This avoids the ArrayBuffer | SharedArrayBuffer type union error.
        const arrayBuffer: ArrayBuffer = (new Uint8Array(keyBuffer)).buffer;

        const encryptionKey: CryptoKey = await encryptionService.importKey(arrayBuffer);
        encryptionService.setUserKey(encryptionKey);

        // Ensure we persist/update latest profile info if available
        try {
          const updatedFields = {
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
          };

          // Update the DB record if any of these are missing or changed
          await db.users.update(existingUser.id, updatedFields);
          existingUser = { ...existingUser, ...updatedFields } as User;
        } catch (err) {
          // Non-fatal: keep using existingUser
          console.warn('Failed to update stored user profile fields', err);
        }
      }

      setUser(existingUser);
      await loadUserData();
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Auth setup error:', authError.message, authError.code);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setUser, loadUserData]);

  const handleGoogleSignIn = useCallback((): void => {
    if (!window.google) {
      console.error('Google Identity Services not loaded');
      return;
    }

    const clientId: string | undefined = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      console.error('Google Client ID not configured');
      return;
    }

    try {
      const client: GoogleTokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: async (response: GoogleTokenResponse): Promise<void> => {
          if (response.error) {
            console.error('Google Sign-In error:', response.error, response.error_description);
            return;
          }

          if (!response.access_token) {
            console.error('No access token received');
            return;
          }

          try {
            // Get user info using access token
            const userInfoResponse: Response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { 
                Authorization: `Bearer ${response.access_token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!userInfoResponse.ok) {
              throw new Error(`Failed to fetch user info: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
            }

            const userInfo: GoogleUserInfo = await userInfoResponse.json() as GoogleUserInfo;
            await handleAuthSuccess(userInfo);
          } catch (error: unknown) {
            const fetchError = error as Error;
            console.error('Error fetching user info:', fetchError.message);
          }
        },
      });

      client.requestAccessToken();
    } catch (error: unknown) {
      const authError = error as AuthError;
      console.error('Google Sign-In error:', authError.message, authError.code);
    }
  }, [handleAuthSuccess]);

  const handleSignOut = useCallback((): void => {
    setUser(null);
    encryptionService.setUserKey(null);
    
    // Clear Google session safely with optional chaining
    window.google?.accounts?.oauth2?.revoke('', (): void => {
      console.log('Google session revoked');
    });
  }, [setUser]);

  if (!isClient) {
    return (
      <button 
        type="button"
        className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 opacity-50 cursor-not-allowed bg-primary/50 text-primary-foreground"
        disabled={true}
        aria-label="Loading authentication"
      >
        Loading...
      </button>
    );
  }

  if (user) {
    return (
      <motion.button
        type="button"
        onClick={handleSignOut}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 hover:border-red-500/60"
        aria-label="Sign out"
      >
        Sign Out
      </motion.button>
    );
  }

  const isLoading: boolean = useAppStore.getState().isLoading;
  const isGoogleReady: boolean = scriptLoaded && !!window.google;

  return (
    <motion.button
      type="button"
      onClick={handleGoogleSignIn}
      disabled={isLoading || !isGoogleReady}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="px-6 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 btn-primary"
      aria-label={isLoading ? 'Signing in...' : 'Sign in with Google'}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          <span>Signing In...</span>
        </>
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Sign In with Google</span>
        </>
      )}
    </motion.button>
  );
}                            