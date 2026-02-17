import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest } from "../api";
import { getTelegramUser } from "../telegram";

export default function NewRequest() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [size, setSize] = useState("");
  const [weight, setWeight] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const user = getTelegramUser();
    if (!user) {
      setError("Не удалось получить данные Telegram");
      return;
    }

    setLoading(true);
    try {
      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city,
        deliveryDate: new Date(deliveryDate).toISOString(),
        size,
        weight: Number(weight),
        boxCount: Number(boxCount),
        comment: comment || undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при создании заявки");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">📦 Новая заявка</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Город доставки</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
            placeholder="Москва"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Дата доставки</label>
          <input
            type="date"
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Габариты (ДxШxВ см)</label>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            required
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
            placeholder="120x80x60"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-tg-hint">Вес (кг)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              required
              min="0.1"
              step="0.1"
              className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
              placeholder="25"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-tg-hint">Кол-во мест</label>
            <input
              type="number"
              value={boxCount}
              onChange={(e) => setBoxCount(e.target.value)}
              required
              min="1"
              className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
              placeholder="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Комментарий</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text resize-none"
            placeholder="Дополнительная информация..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 rounded-lg bg-tg-button text-tg-button-text font-medium disabled:opacity-50"
        >
          {loading ? "Создание..." : "Создать заявку"}
        </button>
      </form>
    </div>
  );
}
