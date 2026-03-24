import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth";
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter basename="/admin">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Requests />} />
            <Route path="/requests/:id" element={<RequestDetail />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/clients/:id" element={<ClientDetail />} />
            <Route path="/schedule" element={<Schedule />} />
            <Route path="/counterparties" element={<Counterparties />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/prices" element={<Prices />} />
            <Route path="/broadcast" element={<Broadcast />} />
            <Route path="/finance" element={<Finance />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
