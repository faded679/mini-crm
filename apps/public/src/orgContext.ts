import {
  getToken,
  getSelectedOrgId,
  setSelectedOrgId,
  clearSelectedOrgId,
} from "./auth";
import { getMe } from "./api";

export type ResolvedOrg =
  | { status: "ok"; counterpartyId: number | null }
  | { status: "need_pick" };

/**
 * Resolve org for creating a request.
 * - uses localStorage if set
 * - auto-picks when client has exactly one org
 * - allows null when client has no orgs (legacy)
 * - need_pick when 2+ orgs and none selected
 */
export async function resolveRequestOrg(): Promise<ResolvedOrg> {
  const existing = getSelectedOrgId();
  if (existing != null) {
    return { status: "ok", counterpartyId: existing };
  }

  const token = getToken();
  if (!token) {
    return { status: "ok", counterpartyId: null };
  }

  const me = await getMe(token);
  const orgs = me.organizations || [];

  if (orgs.length === 0) {
    return { status: "ok", counterpartyId: null };
  }

  if (orgs.length === 1) {
    setSelectedOrgId(orgs[0].id);
    return { status: "ok", counterpartyId: orgs[0].id };
  }

  clearSelectedOrgId();
  return { status: "need_pick" };
}
