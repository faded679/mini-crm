import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ready, getTelegramUser } from "./telegram";
import { checkConsent } from "./api";
import BottomNav from "./components/BottomNav";
import Consent from "./pages/Consent";
import Home from "./pages/Home";
import NewRequest from "./pages/NewRequest";
import History from "./pages/History";
import Info from "./pages/Info";
import RequestDetail from "./pages/RequestDetail";

export default function App() {
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ready();
    const user = getTelegramUser();
    if (user) {
      checkConsent(user.id)
        .then((res) => {
          setConsentGiven(res.consentGiven);
          setConsentChecked(true);
        })
        .catch(() => setConsentChecked(true))
        .finally(() => setLoading(false));
    } else {
      setConsentChecked(true);
      setLoading(false);
    }
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen text-tg-hint text-sm">Загрузка...</div>;
  }

  if (consentChecked && !consentGiven) {
    return <Consent onAccepted={() => setConsentGiven(true)} />;
  }

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/new" element={<NewRequest />} />
        <Route path="/history" element={<History />} />
        <Route path="/history/:id" element={<RequestDetail />} />
        <Route path="/info" element={<Info />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <BottomNav />
    </div>
  );
}
