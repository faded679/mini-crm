import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest, getSchedule, type ScheduleEntry } from "../api";
import { getTelegramUser } from "../telegram";

export default function NewRequest() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [volume, setVolume] = useState("");
  const [weight, setWeight] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSchedule().then(setSchedule).catch(() => {});
  }, []);

  const destinations = [...new Set(schedule.map((s) => s.destination))].sort();
  const availableDates = city
    ? schedule.filter((s) => s.destination === city).sort((a, b) => a.deliveryDate.localeCompare(b.deliveryDate))
    : [];

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
        volume: Number(volume),
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
          <label className="block text-sm font-medium mb-1 text-tg-hint">Направление</label>
          <select
            value={city}
            onChange={(e) => { setCity(e.target.value); setDeliveryDate(""); }}
            required
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
          >
            <option value="">Выберите направление</option>
            {destinations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Дата выгрузки</label>
          <select
            value={deliveryDate}
            onChange={(e) => setDeliveryDate(e.target.value)}
            required
            disabled={!city}
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text disabled:opacity-50"
          >
            <option value="">{city ? "Выберите дату" : "Сначала выберите направление"}</option>
            {availableDates.map((s) => (
              <option key={s.id} value={s.deliveryDate}>
                {new Date(s.deliveryDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "short",
                })}
                {" — приём: " + s.acceptDays}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Объём (м³)</label>
          <input
            type="number"
            value={volume}
            onChange={(e) => setVolume(e.target.value)}
            required
            min="0.001"
            step="0.001"
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
            placeholder="0.12"
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
