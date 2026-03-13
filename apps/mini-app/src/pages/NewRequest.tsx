import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRequest,
  getCities,
  getRates,
  getScheduleForCity,
  type City,
  type PriceRate,
  type ScheduleEntry,
} from "../api";
import { getTelegramUser } from "../telegram";

interface LineItem {
  packaging: "pallets" | "boxes";
  typeName: string;
  typeId: number | null;
  qty: number;
  price: number;
  amount: number;
}

export default function NewRequest() {
  const navigate = useNavigate();

  const [cities, setCities] = useState<City[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  const [cityId, setCityId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [packaging, setPackaging] = useState<"pallets" | "boxes" | "">("");
  const [qty, setQty] = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (cityId) {
      getRates(cityId).then(setRates).catch(() => setRates([]));
      getScheduleForCity(cityId).then(setSchedule).catch(() => setSchedule([]));
    } else {
      setRates([]);
      setSchedule([]);
    }
  }, [cityId]);

  const selectedCity = cities.find((c) => c.id === cityId);

  const findPrice = useCallback(
    (pkg: "pallets" | "boxes") => {
      if (!rates.length) return 0;
      const unit = pkg === "pallets" ? "pallet" : "boxes";
      const rate = rates.find((r) => r.unit === unit);
      return rate?.price ?? 0;
    },
    [rates],
  );

  const handleAddItem = () => {
    if (!packaging || !qty || Number(qty) <= 0) return;
    const price = findPrice(packaging);
    const amount = price * Number(qty);
    const typeName = packaging === "pallets" ? "Палета" : "Коробка";

    setItems((prev) => [
      ...prev,
      { packaging, typeName, typeId: null, qty: Number(qty), price, amount },
    ]);
    setQty("");
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const total = items.reduce((s, it) => s + it.amount, 0);

  const handleSubmit = async () => {
    if (!selectedCity || items.length === 0) return;
    const user = getTelegramUser();
    if (!user) {
      setError("Не удалось получить данные Telegram");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const totalQty = items.reduce((s, it) => s + it.qty, 0);
      const mainPkg = items[0].packaging;
      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: mainPkg,
        boxCount: totalQty,
        comment: items
          .map((it, i) => `${i + 1}. ${it.typeName} x${it.qty} = ${it.amount}₽`)
          .join("; ") + ` | Итого: ${total}₽`,
        items: items.map((it) => ({
          description: `${selectedCity.fullName} ${it.packaging === "pallets" ? "Палета" : "Коробка"} — ${it.typeName}`,
          unit: it.packaging === "pallets" ? "пал" : "кор",
          quantity: it.qty,
          price: it.price,
          amount: it.amount,
        })),
      });
      navigate("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-3 pt-3 pb-28 fade-in">
      <h1 className="text-lg font-bold text-tg-text mb-3">Новая заявка</h1>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>
      )}

      {/* Direction */}
      <select
        value={cityId ?? ""}
        onChange={(e) => {
          setCityId(e.target.value ? Number(e.target.value) : null);
          setDeliveryDate("");
          setPackaging("");
          setQty("");
          setItems([]);
        }}
        className="w-full h-11 px-3 rounded-xl bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm mb-2.5"
      >
        <option value="">Направление</option>
        {cities.map((c) => (
          <option key={c.id} value={c.id}>{c.shortName}</option>
        ))}
      </select>

      {/* Delivery date */}
      {cityId && (
        <div className="mb-2.5 slide-up">
          <label className="block text-[11px] font-medium mb-1 text-tg-hint uppercase tracking-wide">Дата выгрузки</label>
          <select
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setPackaging("");
              setQty("");
            }}
            className="w-full h-11 px-3 rounded-xl bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm"
          >
            <option value="">Выберите дату</option>
            {schedule.map((s) => (
              <option key={s.id} value={s.deliveryDate}>
                {new Date(s.deliveryDate).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "long",
                  weekday: "short",
                })}
              </option>
            ))}
          </select>
          {schedule.length === 0 && (
            <p className="text-[11px] text-tg-hint mt-1">Нет доступных дат</p>
          )}
        </div>
      )}

      {/* Packaging type */}
      {deliveryDate && (
        <div className="grid grid-cols-2 gap-2 mb-2.5 slide-up">
          {(["pallets", "boxes"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPackaging(p);
                setQty("");
              }}
              className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                packaging === p
                  ? "bg-tg-button text-tg-button-text shadow-sm"
                  : "bg-tg-secondary-bg text-tg-text"
              }`}
            >
              {p === "pallets" ? "📦 Палеты" : "📋 Коробки"}
            </button>
          ))}
        </div>
      )}

      {/* Quantity + Add */}
      {packaging && (
        <div className="mb-3 slide-up">
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            placeholder="Кол-во"
            className="w-full h-11 px-3 rounded-xl bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm mb-2"
          />
          <button
            type="button"
            onClick={handleAddItem}
            disabled={!qty || Number(qty) <= 0}
            className="w-full h-11 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold disabled:opacity-40 transition active:scale-[0.97]"
          >
            + Добавить
          </button>
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="bg-tg-secondary-bg rounded-xl overflow-hidden mb-3 slide-up">
          {items.map((it, i) => (
            <div key={i} className="flex items-center px-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text font-medium truncate">
                  {it.packaging === "pallets" ? "Палета" : "Коробка"} · {it.typeName}
                </div>
                <div className="text-[11px] text-tg-hint">
                  {it.qty} × {it.price.toLocaleString("ru-RU")} ₽
                </div>
              </div>
              <span className="text-sm font-semibold text-tg-text ml-2 whitespace-nowrap">
                {it.amount.toLocaleString("ru-RU")} ₽
              </span>
              <button
                type="button"
                onClick={() => handleRemoveItem(i)}
                className="ml-2 w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
          <div className="flex justify-between items-center px-3 py-2" style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}>
            <span className="text-sm font-bold text-tg-text">Итого</span>
            <span className="text-sm font-bold text-tg-button">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-3 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold disabled:opacity-50 transition active:scale-[0.97]"
        >
          {submitting ? "Отправка..." : "Отправить заявку"}
        </button>
      )}
    </div>
  );
}
