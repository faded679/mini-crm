import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../auth";
import { useTheme } from "../theme";
import { Package, Users, LogOut, Calendar, Moon, Sun, Building2, DollarSign, FileText, Megaphone, Wallet } from "lucide-react";
import { getRequests } from "../api";

export default function Layout() {
  const { manager, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const requests = await getRequests();
        if (!alive) return;
        setUnreadCount(requests.filter((r) => !r.isRead).length);
      } catch {
        if (!alive) return;
        setUnreadCount(0);
      }
    };

    load();
    const id = window.setInterval(load, 30_000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
      isActive
        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100"
    }`;

  const isDemo = import.meta.env.VITE_IS_DEMO === "true";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {isDemo && (
        <div className="bg-amber-400 text-amber-900 text-center text-sm font-semibold py-1.5 px-4">
          🟡 ДЕМО-РЕЖИМ — данные сбрасываются каждые 24 часа. Логин: demo@demo.com / demo1234
        </div>
      )}
      <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-lg font-bold text-gray-900 dark:text-white">CRM</span>
              <nav className="flex items-center gap-1">
                <NavLink to="/admin" end className={linkClass}>
                  <Package size={18} />
                  <span className="inline-flex items-center gap-1">
                    <span>Заявки</span>
                    {unreadCount > 0 && (
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        +{unreadCount}
                      </span>
                    )}
                  </span>
                </NavLink>
                <NavLink to="/admin/clients" className={linkClass}>
                  <Users size={18} />
                  Клиенты
                </NavLink>
                <NavLink to="/admin/schedule" className={linkClass}>
                  <Calendar size={18} />
                  Расписание
                </NavLink>
                <NavLink to="/admin/counterparties" className={linkClass}>
                  <Building2 size={18} />
                  Организации
                </NavLink>
                <NavLink to="/admin/invoices" className={linkClass}>
                  <FileText size={18} />
                  Счета
                </NavLink>
                <NavLink to="/admin/prices" className={linkClass}>
                  <DollarSign size={18} />
                  Прайс
                </NavLink>
                <NavLink to="/admin/broadcast" className={linkClass}>
                  <Megaphone size={18} />
                  Рассылка
                </NavLink>
                <NavLink to="/admin/finance" className={linkClass}>
                  <Wallet size={18} />
                  Финансы
                </NavLink>
              </nav>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={toggle}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
                title={theme === "dark" ? "Светлая тема" : "Тёмная тема"}
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <span className="text-sm text-gray-500 dark:text-gray-400">{manager?.name || manager?.email}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition"
              >
                <LogOut size={16} />
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
