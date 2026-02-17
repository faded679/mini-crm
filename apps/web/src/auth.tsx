import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Manager } from "./api";

interface AuthContextType {
  token: string | null;
  manager: Manager | null;
  setAuth: (token: string, manager: Manager) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [manager, setManager] = useState<Manager | null>(() => {
    const stored = localStorage.getItem("manager");
    return stored ? JSON.parse(stored) : null;
  });

  const setAuth = (t: string, m: Manager) => {
    localStorage.setItem("token", t);
    localStorage.setItem("manager", JSON.stringify(m));
    setToken(t);
    setManager(m);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("manager");
    setToken(null);
    setManager(null);
  };

  useEffect(() => {
    if (token) {
      localStorage.setItem("token", token);
    }
  }, [token]);

  return (
    <AuthContext.Provider value={{ token, manager, setAuth, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
