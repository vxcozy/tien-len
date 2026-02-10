import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET ?? 'dev-secret-change-in-production',
);

/** Generate an anonymous JWT for the current user */
export async function generateAnonymousToken(name: string): Promise<string> {
  const userId = `anon_${crypto.randomUUID().slice(0, 8)}`;

  return new SignJWT({ userId, name })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET);
}

/** Get or create a stored auth token */
export async function getOrCreateToken(name?: string): Promise<{ token: string; userId: string; name: string }> {
  // Check localStorage for existing token
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('tienlen_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Decode JWT payload to check expiry
        const payload = JSON.parse(atob(parsed.token.split('.')[1]));
        if (payload.exp * 1000 > Date.now()) {
          return parsed;
        }
      } catch {
        // Invalid stored token, generate new one
      }
    }
  }

  // Generate new anonymous token
  const playerName = name ?? `Player${Math.floor(Math.random() * 9999)}`;
  const token = await generateAnonymousToken(playerName);

  // Decode to get userId
  const payload = JSON.parse(atob(token.split('.')[1]));

  const authData = {
    token,
    userId: payload.userId,
    name: playerName,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('tienlen_auth', JSON.stringify(authData));
  }

  return authData;
}

/** Clear stored auth */
export function clearAuth(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('tienlen_auth');
  }
}
