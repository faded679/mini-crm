import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
import { WarehouseAuthProvider, useWarehouseAuth } from "./warehouseAuth";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Requests from "./pages/Requests";
import RequestDetail from "./pages/RequestDetail";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Schedule from "./pages/Schedule";
import Counterparties from "./pages/Counterparties";
import Invoices from "./pages/Invoices";
import Prices from "./pages/Prices";
import Broadcast from "./pages/Broadcast";
import Finance from "./pages/Finance";
import Reconciliation from "./pages/Reconciliation";
import WarehouseLogin from "./pages/WarehouseLogin";
import WarehouseShipment from "./pages/WarehouseShipment";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function WarehouseProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useWarehouseAuth();
  if (!isAuthenticated) return <Navigate to="/warehouse/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <WarehouseAuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Admin routes */}
            <Route path="/admin/login" element={<Login />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Requests />} />
              <Route path="requests/:id" element={<RequestDetail />} />
              <Route path="clients" element={<Clients />} />
              <Route path="clients/:id" element={<ClientDetail />} />
              <Route path="schedule" element={<Schedule />} />
              <Route path="counterparties" element={<Counterparties />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="prices" element={<Prices />} />
              <Route path="broadcast" element={<Broadcast />} />
              <Route path="finance" element={<Finance />} />
              <Route path="finance/reconciliation/:id" element={<Reconciliation />} />
            </Route>

            {/* Warehouse routes */}
            <Route path="/warehouse/login" element={<WarehouseLogin />} />
            <Route
              path="/warehouse"
              element={
                <WarehouseProtectedRoute>
                  <WarehouseShipment />
                </WarehouseProtectedRoute>
              }
            />

            {/* Redirects */}
            <Route path="/login" element={<Navigate to="/admin/login" replace />} />
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </BrowserRouter>
      </WarehouseAuthProvider>
    </AuthProvider>
  );
}
