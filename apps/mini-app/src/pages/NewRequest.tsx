import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRequest, getBoxTypes, getSchedule, type BoxType, type ScheduleEntry } from "../api";
import { getTelegramUser } from "../telegram";

export default function NewRequest() {
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [city, setCity] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [weight, setWeight] = useState("");
  const [boxCount, setBoxCount] = useState("");
  const [packagingType, setPackagingType] = useState<"pallets" | "boxes" | "">("");
  const [boxTypeId, setBoxTypeId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSchedule().then(setSchedule).catch(() => {});
  }, []);

  useEffect(() => {
    getBoxTypes().then(setBoxTypes).catch(() => {});
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
        packagingType: packagingType as "pallets" | "boxes",
        ...(packagingType === "boxes" && boxTypeId ? { boxTypeId } : {}),
        ...(weight ? { weight: Number(weight) } : {}),
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
            onChange={(e) => {
              setCity(e.target.value);
              setDeliveryDate("");
              setPackagingType("");
              setBoxTypeId(null);
              setBoxCount("");
              setWeight("");
            }}
            required
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
          >
            <option value="">Выбор направления</option>
            {destinations.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Дата выгрузки</label>
          <select
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setPackagingType("");
              setBoxTypeId(null);
              setBoxCount("");
              setWeight("");
            }}
            required
            disabled={!city}
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text disabled:opacity-50"
          >
            <option value="">{city ? "Выберите дату" : "...выберите направление"}</option>
            {availableDates.map((s) => (
              <option key={s.id} value={s.deliveryDate}>
                {new Date(s.deliveryDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "short",
                })}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-tg-hint">Тип груза</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={!deliveryDate}
              onClick={() => {
                setPackagingType("pallets");
                setBoxTypeId(null);
                setBoxCount("");
              }}
              className={`w-full p-3 rounded-lg font-medium transition disabled:opacity-50 ${
                packagingType === "pallets" ? "bg-tg-button text-tg-button-text" : "bg-tg-secondary-bg text-tg-text"
              }`}
            >
              Палеты
            </button>
            <button
              type="button"
              disabled={!deliveryDate}
              onClick={() => {
                setPackagingType("boxes");
                setBoxTypeId(null);
                setBoxCount("");
              }}
              className={`w-full p-3 rounded-lg font-medium transition disabled:opacity-50 ${
                packagingType === "boxes" ? "bg-tg-button text-tg-button-text" : "bg-tg-secondary-bg text-tg-text"
              }`}
            >
              Коробки
            </button>
          </div>
        </div>

        {packagingType === "boxes" && (
          <div>
            <label className="block text-sm font-medium mb-1 text-tg-hint">Размер коробки</label>
            <div className="grid grid-cols-3 gap-2">
              {boxTypes
                .filter((t) => t.name === "Маленькая" || t.name === "Средняя" || t.name === "Большая")
                .sort((a, b) => a.maxVolumeM3 - b.maxVolumeM3)
                .map((t) => {
                  const active = boxTypeId === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setBoxTypeId(t.id)}
                      className={
                        "p-3 rounded-lg border text-sm font-medium transition " +
                        (active
                          ? "bg-tg-button text-tg-button-text border-transparent"
                          : "bg-tg-secondary-bg text-tg-text border-transparent opacity-90")
                      }
                    >
                      {t.name}
                    </button>
                  );
                })}
            </div>
            {!boxTypes.length && (
              <div className="text-xs text-tg-hint mt-2">Загрузка типов коробок…</div>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1 text-tg-hint">
              {packagingType === "pallets" ? "Кол-во палет" : packagingType === "boxes" ? "Кол-во коробок" : "Количество"}
            </label>
            <input
              type="number"
              value={boxCount}
              onChange={(e) => setBoxCount(e.target.value)}
              required
              disabled={!packagingType}
              min="1"
              className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text disabled:opacity-50"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-tg-hint">Вес (кг) (необязательно)</label>
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              min="0.1"
              step="0.1"
              className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
              placeholder="25"
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
          disabled={loading || (packagingType === "boxes" && !boxTypeId)}
          className="w-full p-3 rounded-lg bg-tg-button text-tg-button-text font-medium disabled:opacity-50"
        >
          {loading ? "Создание..." : "Создать заявку"}
        </button>
      </form>
    </div>
  );
}
