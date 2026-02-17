import { useEffect } from "react";
import { Routes, Route, Navigate, Link, useLocation } from "react-router-dom";
import { ready } from "./telegram";
import MyRequests from "./pages/MyRequests";
import NewRequest from "./pages/NewRequest";
import Schedule from "./pages/Schedule";

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
  useEffect(() => {
    ready();
  }, []);

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
