import { useState, useEffect, useCallback } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import {
  isAuthenticated,
  getToken,
  getSelectedOrgId,
  setSelectedOrgId,
  clearSelectedOrgId,
  migrateOrgStorage,
} from "./auth";
import { getMe, type ClientOrganization, type MeResponse } from "./api";
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

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [me, setMe] = useState<MeResponse | null>(null);
  const [orgReady, setOrgReady] = useState(false);
  const [needsOrgPick, setNeedsOrgPick] = useState(false);
  const [organizations, setOrganizations] = useState<ClientOrganization[]>([]);
  const [loadingMe, setLoadingMe] = useState(false);

  const resolveOrgContext = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setMe(null);
      setOrgReady(false);
      setNeedsOrgPick(false);
      setOrganizations([]);
      return;
    }

    setLoadingMe(true);
    try {
      const data = await getMe(token);
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
      // Don't open cabinet without org context — FBO/FBS would fail with "org not selected"
      setNeedsOrgPick(false);
      setOrgReady(false);
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
    window.addEventListener("se-org-changed", check);
    return () => {
      window.removeEventListener("storage", check);
      window.removeEventListener("se-org-changed", check);
    };
  }, []);

  useEffect(() => {
    if (authed) {
      resolveOrgContext();
    } else {
      setMe(null);
      setOrgReady(false);
      setNeedsOrgPick(false);
      setOrganizations([]);
    }
  }, [authed, resolveOrgContext]);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  if (!orgReady && !needsOrgPick) {
    return (
      <div className="min-h-[100dvh] bg-bg flex flex-col items-center justify-center gap-3 px-4">
        <p className="text-muted text-sm">{loadingMe ? "Загрузка..." : "Не удалось загрузить профиль"}</p>
        {!loadingMe && (
          <button
            type="button"
            className="text-sm text-accent underline"
            onClick={() => resolveOrgContext()}
          >
            Повторить
          </button>
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
