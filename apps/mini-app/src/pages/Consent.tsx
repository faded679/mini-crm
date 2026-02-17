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
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📋 Согласие на обработку данных</h1>

      <div className="bg-tg-secondary-bg rounded-xl p-4 mb-4 text-sm text-tg-text leading-relaxed">
        <p className="mb-3">
          Для использования сервиса нам необходимо ваше согласие на обработку персональных данных.
        </p>
        <p className="mb-2 font-medium">Мы обрабатываем следующие данные:</p>
        <ul className="list-disc pl-5 mb-3 space-y-1">
          <li>Telegram ID, имя пользователя, имя и фамилия</li>
          <li>Данные о заявках на перевозку (город, дата, габариты, вес)</li>
        </ul>
        <p>
          Данные используются исключительно для обработки ваших заявок на перевозку грузов
          и не передаются третьим лицам.
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      <button
        onClick={handleAccept}
        disabled={loading}
        className="w-full p-3 rounded-lg bg-tg-button text-tg-button-text font-medium disabled:opacity-50"
      >
        {loading ? "Обработка..." : "✅ Даю согласие"}
      </button>
    </div>
  );
}
