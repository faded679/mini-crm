import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { isAuthenticated } from "./auth";
import BottomNav from "./components/BottomNav";
import Login from "./pages/Login";
import Home from "./pages/Home";
import FbsRequest from "./pages/FbsRequest";
import FboRequest from "./pages/FboRequest";
import Orders from "./pages/Orders";
import Profile from "./pages/Profile";
import Info from "./pages/Info";
import Success from "./pages/Success";

export default function App() {
  const [authed, setAuthed] = useState(isAuthenticated());

  useEffect(() => {
    const check = () => setAuthed(isAuthenticated());
    window.addEventListener("storage", check);
    return () => window.removeEventListener("storage", check);
  }, []);

  if (!authed) {
    return <Login onSuccess={() => setAuthed(true)} />;
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-[420px] mx-auto min-h-screen pb-32 px-3.5 pt-3.5">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/fbs" element={<FbsRequest />} />
          <Route path="/fbo" element={<FboRequest />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/info" element={<Info />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/success/:id" element={<Success />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </div>
  );
}
