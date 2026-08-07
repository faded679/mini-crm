const PHONE_KEY = "se_phone";
const TOKEN_KEY = "se_token";
const ORG_KEY = "se_counterparty_id";

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
  clearSelectedOrgId();
}

export function getSelectedOrgId(): number | null {
  const raw = localStorage.getItem(ORG_KEY);
  if (!raw) return null;
  const id = Number(raw);
  return Number.isFinite(id) ? id : null;
}

export function setSelectedOrgId(id: number) {
  localStorage.setItem(ORG_KEY, String(id));
  window.dispatchEvent(new Event("se-org-changed"));
}

export function clearSelectedOrgId() {
  localStorage.removeItem(ORG_KEY);
  window.dispatchEvent(new Event("se-org-changed"));
}

export function isAuthenticated(): boolean {
  return !!getPhone() && !!getToken();
}

export function getAuthHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
