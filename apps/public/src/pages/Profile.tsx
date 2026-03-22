import { getPhone, clearAuth } from "../auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const navigate = useNavigate();
  const phone = getPhone();

  const handleLogout = () => {
    clearAuth();
    window.location.reload();
  };

  return (
    <div className="fade-in">
      <h1 className="text-heading text-[22px] font-bold mb-3">Профиль</h1>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-sm text-heading"><strong>Телефон:</strong> {phone}</p>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-muted text-xs">Баланс клиента</p>
        <p className="text-[34px] font-bold text-accent mt-1 mb-1">0 ₽</p>
        <p className="text-sm text-muted">Функция в разработке</p>
      </section>

      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-2xl bg-red-50 text-red-600 text-sm font-semibold transition active:opacity-80"
      >
        Выйти
      </button>
    </div>
  );
}
