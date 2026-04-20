import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  warehouseLogin,
  getWarehouseToken,
  setWarehouseToken,
  clearWarehouseToken,
  type WarehouseWorker,
} from "./api";

interface WarehouseAuthContextType {
  worker: WarehouseWorker | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const WarehouseAuthContext = createContext<WarehouseAuthContextType | undefined>(undefined);

export function WarehouseAuthProvider({ children }: { children: ReactNode }) {
  const [worker, setWorker] = useState<WarehouseWorker | null>(null);

  useEffect(() => {
    const token = getWarehouseToken();
    if (token) {
      try {
        // Проверяем локальное время входа (7 дней)
        const loginTime = localStorage.getItem("warehouse_login_time");
        if (loginTime) {
          const elapsed = Date.now() - Number(loginTime);
          if (elapsed > 7 * 24 * 60 * 60 * 1000) {
            clearWarehouseToken();
            localStorage.removeItem("warehouse_worker");
            localStorage.removeItem("warehouse_login_time");
            return;
          }
        }
        const workerData = localStorage.getItem("warehouse_worker");
        if (workerData) {
          setWorker(JSON.parse(workerData));
        }
      } catch {
        clearWarehouseToken();
        localStorage.removeItem("warehouse_worker");
        localStorage.removeItem("warehouse_login_time");
      }
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await warehouseLogin(email, password);
    setWarehouseToken(response.token);
    localStorage.setItem("warehouse_worker", JSON.stringify(response.worker));
    localStorage.setItem("warehouse_login_time", String(Date.now()));
    setWorker(response.worker);
  };

  const logout = () => {
    clearWarehouseToken();
    localStorage.removeItem("warehouse_worker");
    localStorage.removeItem("warehouse_login_time");
    setWorker(null);
  };

  return (
    <WarehouseAuthContext.Provider
      value={{
        worker,
        isAuthenticated: !!worker,
        login,
        logout,
      }}
    >
      {children}
    </WarehouseAuthContext.Provider>
  );
}

export function useWarehouseAuth() {
  const context = useContext(WarehouseAuthContext);
  if (!context) {
    throw new Error("useWarehouseAuth must be used within WarehouseAuthProvider");
  }
  return context;
}
