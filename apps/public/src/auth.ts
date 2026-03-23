const PHONE_KEY = "se_phone";
const TOKEN_KEY = "se_token";

export function getPhone(): string | null {
  return localStorage.getItem(PHONE_KEY);
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function saveAuth(phone: string, token: string) {
  localStorage.setItem(PHONE_KEY, phone);
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuth() {
  localStorage.removeItem(PHONE_KEY);
  localStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getPhone() && !!getToken();
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
