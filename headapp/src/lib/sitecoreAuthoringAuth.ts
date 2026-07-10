// lib/sitecoreAuthoringAuth.ts

interface CachedToken {
  token: string;
  expiresAt: number;
}

let cachedToken: CachedToken | null = null;

export async function getSitecoreAuthToken(): Promise<string> {
  // Reuse cached token if it's still valid (with a 30s safety buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 30_000) {
    return cachedToken.token;
  }

  const clientId = process.env.SITECORE_AUTH_CLIENT_ID;
  const clientSecret = process.env.SITECORE_AUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing SITECORE_AUTH_CLIENT_ID or SITECORE_AUTH_CLIENT_SECRET environment variables.'
    );
  }

  const response = await fetch('https://auth.sitecorecloud.io/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      audience: 'https://api.sitecorecloud.io',
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Sitecore OAuth token request failed: ${response.status} - ${text}`);
  }

  const data = await response.json();

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}