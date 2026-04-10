import { useState } from "react";
import { completeProfile } from "../api";

interface ProfileCompletionProps {
  onSuccess: () => void;
}

export default function ProfileCompletion({ onSuccess }: ProfileCompletionProps) {
  const [email, setEmail] = useState("");
  const [inn, setInn] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleInnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    // Убираем все кроме цифр
    const digits = input.replace(/\D/g, "");
    // Ограничиваем 12 цифрами
    setInn(digits.slice(0, 12));
  };

  const handleSubmit = async () => {
    if (!email || !email.includes("@")) {
      setError("Введите корректный email");
      return;
    }
    if (!inn || (inn.length !== 10 && inn.length !== 12)) {
      setError("ИНН должен содержать 10 или 12 цифр");
      return;
    }

    setLoading(true);
    setError("");
    try {
      await completeProfile(email, inn);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-4">
      <div className="w-full max-w-[380px] fade-in">
        <div className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-[42px] h-[42px] rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm">
              СЭ
            </div>
            <div>
              <p className="text-muted text-xs m-0">Логистический сервис</p>
              <h1 className="text-heading text-lg font-bold m-0">Соловьев-Экспресс</h1>
            </div>
          </div>

          <h2 className="text-heading text-base font-bold mb-3">Заполните профиль</h2>
          <p className="text-muted text-sm mb-4">
            Для создания заявок необходимо указать email и ИНН вашей организации
          </p>

          <div className="mb-3">
            <label className="text-heading text-xs font-semibold mb-1 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@company.ru"
              className="w-full h-12 px-4 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm transition-all focus:border-accent"
            />
          </div>

          <div className="mb-4">
            <label className="text-heading text-xs font-semibold mb-1 block">ИНН организации</label>
            <input
              type="text"
              value={inn}
              onChange={handleInnChange}
              placeholder="1234567890"
              className="w-full h-12 px-4 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm transition-all focus:border-accent"
            />
            <p className="text-muted text-xs mt-1">10 или 12 цифр</p>
          </div>

          {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-50 transition active:bg-accent-dark"
          >
            {loading ? "Сохранение..." : "Продолжить"}
          </button>
        </div>
      </div>
    </div>
  );
}
