import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  isAuthenticated,
  getToken,
  getSelectedOrgId,
  setSelectedOrgId,
  clearSelectedOrgId,
  clearAuth,
  migrateOrgStorage,
} from "./auth";
import { getMe, ApiRequestError, type ClientOrganization, type MeResponse } from "./api";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import FbsRequest from "./pages/FbsRequest";
import FboRequest from "./pages/FboRequest";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Info from "./pages/Info";
import Success from "./pages/Success";
import SelectOrganization from "./pages/SelectOrganization";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getMeWithRetry(token: string, attempts = 3): Promise<MeResponse> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await getMe(token);
    } catch (err) {
      lastErr = err;
      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
        throw err;
      }
      if (i < attempts - 1) {
        await sleep(400 * (i + 1));
      }
    }
  }
  throw lastErr;
}

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [orgReady, setOrgReady] = useState(false);
  const [needsOrgPick, setNeedsOrgPick] = useState(false);
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  /** true until first /me attempt finishes — avoids false "failed to load" flash */
  const [loadingMe, setLoadingMe] = useState(() => isAuthenticated());
  const [loadError, setLoadError] = useState<string | null>(null);

  const resolveOrgContext = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setMe(null);
      setOrgReady(false);
      setNeedsOrgPick(false);
      setOrganizations([]);
      setLoadingMe(false);
      setLoadError(null);
      return;
    }

    setLoadingMe(true);
    setLoadError(null);
    try {
      const data = await getMeWithRetry(token);
      setMe(data);
      const orgs = data.organizations || [];
      setOrganizations(orgs);

      if (orgs.length === 0) {
        clearSelectedOrgId();
        setNeedsOrgPick(false);
        setOrgReady(true);
        return;
      }

      if (orgs.length === 1) {
        setSelectedOrgId(orgs[0].id);
        setNeedsOrgPick(false);
        setOrgReady(true);
        return;
      }

      const selected = getSelectedOrgId();
      const valid = selected != null && orgs.some((o) => o.id === selected);
      if (!valid) {
        clearSelectedOrgId();
        setNeedsOrgPick(true);
        setOrgReady(false);
        return;
      }

      setNeedsOrgPick(false);
      setOrgReady(true);
    } catch (err) {
      console.error("Failed to load /me for org context:", err);

      if (err instanceof ApiRequestError && (err.status === 401 || err.status === 403)) {
        clearAuth();
        setAuthed(false);
        setMe(null);
        setOrgReady(false);
        setNeedsOrgPick(false);
        setOrganizations([]);
        setLoadError(null);
        return;
      }

      // Degraded: if org already chosen, open cabinet — FBO/FBS will re-fetch /me on submit
      if (getSelectedOrgId() != null) {
        setNeedsOrgPick(false);
        setOrgReady(true);
        setLoadError(null);
        return;
      }

      setNeedsOrgPick(false);
      setOrgReady(false);
      setLoadError(
        err instanceof ApiRequestError
          ? `Не удалось загрузить профиль (${err.status})`
          : "Не удалось загрузить профиль. Проверьте интернет и попробуйте снова."
      );
    } finally {
      setLoadingMe(false);
    }
  }, []);

  useEffect(() => {
    migrateOrgStorage();
  }, []);

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", check);
    return () => {
      window.removeEventListener("storage", check);
    };
  }, []);

  useEffect(() => {
    if (authed) {
      setLoadingMe(true);
      resolveOrgContext();
    } else {
      setMe(null);
      setOrgReady(false);
      setNeedsOrgPick(false);
      setOrganizations([]);
      setLoadingMe(false);
      setLoadError(null);
    }
  }, [authed, resolveOrgContext]);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  if (!orgReady && !needsOrgPick) {
    return (
      <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center gap-3 px-4 text-center">
        {loadingMe || !loadError ? (
          <p className="text-muted text-sm">Загрузка...</p>
        ) : (
          <>
            <p className="text-muted text-sm">{loadError}</p>
            <button
              type="button"
              className="text-sm text-accent underline"
              onClick={() => resolveOrgContext()}
            >
              Повторить
            </button>
            <button
              type="button"
              className="text-sm text-muted underline"
              onClick={() => {
                clearAuth();
                setAuthed(false);
              }}
            >
              Выйти и войти заново
            </button>
          </>
        )}
      </div>
    );
  }

  if (needsOrgPick) {
    return (
      <SelectOrganization
        organizations={organizations}
        onSelected={() => {
          setNeedsOrgPick(false);
          setOrgReady(true);
        }}
      />
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg">
      <div className="max-w-[420px] mx-auto min-h-[100dvh] pb-32 px-3.5 pt-10">
        <Routes>
          <Route path="/" element={<Home me={me} />} />
          <Route path="/fbs" element={<FbsRequest />} />
          <Route path="/fbo" element={<FboRequest />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/info" element={<Info />} />
          <Route
            path="/profile"
            element={
              <Profile
                organizations={organizations}
                onSwitchOrganization={() => {
                  clearSelectedOrgId();
                  setNeedsOrgPick(true);
                  setOrgReady(false);
                }}
              />
            }
          />
          <Route path="/success/:id" element={<Success />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
