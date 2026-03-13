import { useState } from "react";
import { acceptConsent } from "../api";
import { getTelegramUser } from "../telegram";

interface ConsentProps {
  onAccepted: () => void;
}

export default function Consent({ onAccepted }: ConsentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    const user = getTelegramUser();
    if (!user) {
      setError("Не удалось получить данные Telegram");
      return;
    }

    setLoading(true);
    try {
      await acceptConsent({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
      });
      onAccepted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 pb-8 fade-in">
      <div className="w-full max-w-sm">
        <div className="text-center mb-4">
          <div className="text-3xl mb-2">🔒</div>
          <h1 className="text-lg font-bold text-tg-text">Согласие на обработку данных</h1>
        </div>

        <div className="bg-tg-secondary-bg rounded-xl px-3 py-3 mb-4 text-xs text-tg-hint leading-relaxed space-y-2">
          <p>Для использования сервиса нам необходимо ваше согласие на обработку персональных данных.</p>
          <p className="font-medium text-tg-text">Мы обрабатываем:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Telegram ID, имя пользователя</li>
            <li>Данные заявок (город, дата, вес)</li>
          </ul>
          <p>Данные не передаются третьим лицам.</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>
        )}

        <button
          onClick={handleAccept}
          disabled={loading}
          className="w-full py-3 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold disabled:opacity-50 transition active:scale-[0.97]"
        >
          {loading ? "Обработка..." : "Даю согласие"}
        </button>
      </div>
    </div>
  );
}
