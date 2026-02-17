import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ready } from "./telegram";
import MyRequests from "./pages/MyRequests";
import NewRequest from "./pages/NewRequest";

export default function App() {
  useEffect(() => {
    ready();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<MyRequests />} />
      <Route path="/new" element={<NewRequest />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
