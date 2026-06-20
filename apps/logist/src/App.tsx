import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated, getMe, removeToken } from "./api";
import Login from "./pages/Login";
import Home from "./pages/Home";
import RequestsList from "./pages/RequestsList";
import CarrierForm from "./pages/CarrierForm";
import Success from "./pages/Success";
import History from "./pages/History";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());
  const [checking, setChecking] = useState(isAuthenticated());

  useEffect(() => {
    if (!authed) return;
    getMe()
      .catch(() => {
        removeToken();
        setAuthed(false);
      })
      .finally(() => setChecking(false));
  }, [authed]);

  if (checking) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-100">
        <div className="text-gray-400">Загрузка...</div>
      </div>
    );
  }

  if (!authed) {
    return <Login onSuccess={() => { setAuthed(true); setChecking(false); }} />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/requests" element={<RequestsList />} />
      <Route path="/carrier-form" element={<CarrierForm />} />
      <Route path="/success/:id" element={<Success />} />
      <Route path="/history" element={<History />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
