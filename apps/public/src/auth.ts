const PHONE_KEY = "se_phone";
const TOKEN_KEY = "se_token";
const ORG_KEY = "se_counterparty_id";
/** Bump to force clients to re-resolve org selection once (clears stale se_counterparty_id). */
const ORG_CTX_VERSION = "2";
const ORG_CTX_VERSION_KEY = "se_org_ctx_v";

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

/**
 * One-time migration: clear stale org id after cabinet org-scoping rollout
 * so clients re-auto-pick (1 org) or see the picker (2+ orgs).
 */
export function migrateOrgStorage() {
  try {
    if (localStorage.getItem(ORG_CTX_VERSION_KEY) === ORG_CTX_VERSION) return;
    localStorage.removeItem(ORG_KEY);
    localStorage.setItem(ORG_CTX_VERSION_KEY, ORG_CTX_VERSION);
  } catch {
    /* ignore */
  }
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
