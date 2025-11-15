import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface OAuthConfig {
  provider: 'google_fit' | 'fitbit';
  clientId: string;
  scopes: string[];
  authorizationEndpoint: string;
  tokenEndpoint: string;
}

const OAUTH_CONFIGS: Record<'google_fit' | 'fitbit', Omit<OAuthConfig, 'clientId'>> = {
  google_fit: {
    provider: 'google_fit',
    scopes: [
      'https://www.googleapis.com/auth/fitness.activity.read',
      'https://www.googleapis.com/auth/fitness.body.read',
      'https://www.googleapis.com/auth/fitness.nutrition.read',
      'https://www.googleapis.com/auth/fitness.sleep.read',
    ],
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
  },
  fitbit: {
    provider: 'fitbit',
    scopes: ['activity', 'heartrate', 'nutrition', 'sleep', 'weight'],
    authorizationEndpoint: 'https://www.fitbit.com/oauth2/authorize',
    tokenEndpoint: 'https://api.fitbit.com/oauth2/token',
  },
};

export const useWearableOAuth = () => {
  const [connecting, setConnecting] = useState(false);
  const { toast } = useToast();

  const getRedirectUri = () => {
    return `${window.location.origin}/auth/callback`;
  };

  const generateCodeVerifier = () => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const base64 = btoa(String.fromCharCode(...new Uint8Array(hash)));
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  };

  const initiateOAuth = async (provider: 'google_fit' | 'fitbit', clientId: string) => {
    setConnecting(true);
    
    try {
      const config = OAUTH_CONFIGS[provider];
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = crypto.randomUUID();

      // Store PKCE values in sessionStorage for callback
      sessionStorage.setItem('oauth_code_verifier', codeVerifier);
      sessionStorage.setItem('oauth_state', state);
      sessionStorage.setItem('oauth_provider', provider);

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: config.scopes.join(' '),
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      });

      // For mobile detection and deep linking
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile) {
        // Mobile: Try to open native app first, fallback to web
        const authUrl = `${config.authorizationEndpoint}?${params.toString()}`;
        window.location.href = authUrl;
      } else {
        // Desktop: Open in popup
        const width = 500;
        const height = 600;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;
        
        const popup = window.open(
          `${config.authorizationEndpoint}?${params.toString()}`,
          'OAuth',
          `width=${width},height=${height},left=${left},top=${top}`
        );

        // Listen for popup closure
        const checkPopup = setInterval(() => {
          if (popup?.closed) {
            clearInterval(checkPopup);
            setConnecting(false);
          }
        }, 500);
      }
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.message,
        variant: 'destructive',
      });
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    const storedState = sessionStorage.getItem('oauth_state');
    const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
    const provider = sessionStorage.getItem('oauth_provider') as 'google_fit' | 'fitbit';

    if (!storedState || state !== storedState) {
      throw new Error('Invalid state parameter');
    }

    if (!codeVerifier || !provider) {
      throw new Error('Missing OAuth session data');
    }

    // Exchange code for tokens via edge function (to keep client_secret secure)
    const { data: session } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/exchange-oauth-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.session?.access_token}`,
      },
      body: JSON.stringify({
        provider,
        code,
        code_verifier: codeVerifier,
        redirect_uri: getRedirectUri(),
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange OAuth code');
    }

    const tokenData = await response.json();

    // Store connection in database
    const { data: user } = await supabase.auth.getUser();
    
    await supabase.from('wearable_connections').upsert(
      {
        user_id: user.user?.id,
        provider,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        last_sync: new Date().toISOString(),
        is_active: true,
      },
      { onConflict: 'user_id,provider' }
    );

    // Clear session storage
    sessionStorage.removeItem('oauth_code_verifier');
    sessionStorage.removeItem('oauth_state');
    sessionStorage.removeItem('oauth_provider');

    return tokenData;
  };

  const disconnectWearable = async (provider: 'google_fit' | 'fitbit') => {
    const { data: user } = await supabase.auth.getUser();
    
    await supabase
      .from('wearable_connections')
      .update({ is_active: false })
      .eq('user_id', user.user?.id)
      .eq('provider', provider);
  };

  return {
    connecting,
    initiateOAuth,
    handleOAuthCallback,
    disconnectWearable,
  };
};

