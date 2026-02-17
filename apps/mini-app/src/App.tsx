import { useEffect, useState } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { ready, getTelegramUser } from "./telegram";
import { checkConsent } from "./api";
import MyRequests from "./pages/MyRequests";
import NewRequest from "./pages/NewRequest";
import Schedule from "./pages/Schedule";
import Consent from "./pages/Consent";

function NavBar() {
  const { pathname } = useLocation();
  return (
    <nav className="flex border-b border-tg-secondary-bg bg-tg-bg sticky top-0 z-10">
      <Link
        to="/"
        className={`flex-1 text-center py-3 text-sm font-medium transition ${
          pathname === "/" ? "text-tg-button border-b-2 border-tg-button" : "text-tg-hint"
        }`}
      >
        📋 Заявки
      </Link>
      <Link
        to="/schedule"
        className={`flex-1 text-center py-3 text-sm font-medium transition ${
          pathname === "/schedule" ? "text-tg-button border-b-2 border-tg-button" : "text-tg-hint"
        }`}
      >
        📅 Расписание
      </Link>
    </nav>
  );
}

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
    return <div className="p-4 text-center text-tg-hint">Загрузка...</div>;
  }

  if (consentChecked && !consentGiven) {
    return <Consent onAccepted={() => setConsentGiven(true)} />;
  }

  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<MyRequests />} />
        <Route path="/new" element={<NewRequest />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
