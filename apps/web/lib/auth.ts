const TOKEN_KEY = "streamlocal_token";

export interface UserPayload {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  iat?: number;
  exp?: number;
}

/**
 * Get JWT token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode JWT payload without verification (client-side only)
 */
function decodeJWT(token: string): UserPayload | null {
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

/**
 * Check if the stored token exists and is not expired
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  const payload = decodeJWT(token);
  if (!payload) return false;

  // Check expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      removeToken();
      return false;
    }
  }

  return true;
}

/**
 * Get user info from the stored JWT token
 */
export function getUser(): UserPayload | null {
  const token = getToken();
  if (!token) return null;

  const payload = decodeJWT(token);
  if (!payload) return null;

  // Check expiration
  if (payload.exp) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= payload.exp) {
      removeToken();
      return null;
    }
  }

  return payload;
}
