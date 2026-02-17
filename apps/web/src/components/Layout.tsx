import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useTheme } from "../theme";
import { Package, Users, LogOut, Calendar, Moon, Sun } from "lucide-react";

export default function Layout() {
  const { manager, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-8">
              <span className="text-lg font-bold text-gray-900 dark:text-white">Mini CRM</span>
              <nav className="flex items-center gap-1">
                <NavLink to="/" end className={linkClass}>
                  <Package size={18} />
                  Заявки
                </NavLink>
                <NavLink to="/clients" className={linkClass}>
                  <Users size={18} />
                  Клиенты
                </NavLink>
                <NavLink to="/schedule" className={linkClass}>
                  <Calendar size={18} />
                  Расписание
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
