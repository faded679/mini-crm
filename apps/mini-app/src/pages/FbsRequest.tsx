import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRequest,
  getCitiesFbs,
  getScheduleFbs,
  getPriceFbs,
  type CityFbs,
  type ScheduleEntryFbs,
  type PriceFbsEntry,
} from "../api";
import { getTelegramUser } from "../telegram";

interface LineItem {
  volume: string;
  price: string;
  qty: number;
  amount: number;
}

export default function FbsRequest() {
  const navigate = useNavigate();

  const [cities, setCities] = useState<CityFbs[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntryFbs[]>([]);
  const [prices, setPrices] = useState<PriceFbsEntry[]>([]);

  const [cityId, setCityId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [mpDate, setMpDate] = useState("");
  const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [qty, setQty] = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCitiesFbs().then((data) => {
      setCities(data);
      const def = data.find((c) => c.shortName === "WB Курск FBS");
      if (def) setCityId(def.id);
    }).catch(() => {});
  }, []);

  const selectedCity = cities.find((c) => c.id === cityId);

  useEffect(() => {
    if (cityId && selectedCity) {
      getScheduleFbs(cityId).then(setSchedule).catch(() => setSchedule([]));
      getPriceFbs(selectedCity.shortName).then((data) => {
        setPrices(data);
        const def = data.find((p) => p.volume.includes("0.1"));
        if (def) setSelectedPriceId(def.id);
      }).catch(() => setPrices([]));
    } else {
      setSchedule([]);
      setPrices([]);
    }
  }, [cityId, selectedCity]);

  const selectedPrice = prices.find((p) => p.id === selectedPriceId);

  const handleAddItem = () => {
    if (!selectedPrice || !qty || Number(qty) <= 0) return;
    const priceNum = parseFloat(selectedPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    const volNum = parseFloat(selectedPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
    const units = Number(qty) / volNum;
    const amount = Math.round(priceNum * units * 100) / 100;
    setItems((prev) => [
      ...prev,
      {
        volume: selectedPrice.volume,
        price: selectedPrice.price,
        qty: Number(qty),
        amount,
      },
    ]);
    setQty("");
    setSelectedPriceId(null);
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
      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        mpAccountDate: mpDate || undefined,
        packagingType: "boxes",
        boxCount: totalQty,
        deliveryTypeId: 1, // FBS
        comment:
          items
            .map((it, i) => `${i + 1}. ${it.volume} x${it.qty} = ${it.amount}₽`)
            .join("; ") + ` | Итого: ${total}₽`,
        items: items.map((it) => ({
          description: `${selectedCity.shortName} FBS — ${it.volume}`,
          unit: "м³",
          quantity: it.qty,
          price: parseFloat(it.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
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
      <div className="mb-6 text-center">
        <p
          className="text-base font-semibold text-white"
          style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.6)" }}
        >
          {!cityId
            ? "Выберите направление"
            : !deliveryDate
            ? "Выберите дату"
            : !mpDate
            ? "Укажите дату поставки на МП"
            : items.length === 0
            ? "Укажите кол-во кубов"
            : "Отправьте заявку"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>
      )}

      {/* Direction & Date */}
      <div className="flex gap-3 mb-3">
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            setCityId(e.target.value ? Number(e.target.value) : null);
            setDeliveryDate("");
            setMpDate("");
            setQty("");
            setItems([]);
          }}
          className="h-12 px-4 rounded-2xl bg-gradient-to-br from-tg-secondary-bg to-tg-secondary-bg border-0 outline-none text-tg-text text-sm appearance-none shadow-lg transition-all w-3/5"
          style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
        >

          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.shortName}
            </option>
          ))}
        </select>

        {cityId && (
          <select
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setMpDate("");
              setQty("");
            }}
            className="h-12 px-4 rounded-2xl bg-gradient-to-br from-tg-secondary-bg to-tg-secondary-bg border-0 outline-none text-tg-text text-sm slide-up w-2/5 min-w-0 appearance-none shadow-lg transition-all"
            style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
          >
            <option value="">📅 Дата</option>
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
        )}
      </div>
      {cityId && schedule.length === 0 && (
        <p className="text-[11px] text-tg-hint mb-2">Нет доступных дат</p>
      )}

      {/* MP delivery date */}
      {deliveryDate && (
        <div className="mb-3 slide-up">
          <input
            type="date"
            value={mpDate}
            onChange={(e) => setMpDate(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-gradient-to-br from-tg-secondary-bg to-tg-secondary-bg border-0 outline-none text-tg-text text-sm shadow-lg transition-all"
            style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
            placeholder="Дата поставки на МП"
          />

          <p className="text-[11px] text-tg-hint mt-1 mb-1">📅 Дата поставки на маркетплейс в ЛК</p>
       {!mpDate && (
        <div
          className="rounded-xl px-3 py-2 mt-1"
          style={{ backgroundColor: "rgba(255, 170, 0, 0.12)" }}
        >
          <p className="text-[11px] text-yellow-500 font-medium leading-relaxed">
            ⚠️ Важно! Плановая дата поставки на МП должна совпадать с датой выгрузки нашего автомобиля
            согласно графика. Машина может отгружаться ± 24 часа от даты в графике без предупреждения.
          </p>
        </div>
  )}


        </div>
      )}

      {/* Voume (from prise-fbs) */}
      {deliveryDate && mpDate && prices.length > 0 && (
        <div className="mb-3 slide-up">
          <select
            value={selectedPriceId ?? ""}
            onChange={(e) => setSelectedPriceId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-12 px-4 rounded-2xl bg-gradient-to-br from-tg-secondary-bg to-tg-secondary-bg border-0 outline-none text-tg-text text-sm shadow-lg transition-all"
            style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
          >

            {prices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.volume} — {p.price}{p.comment ? ` (${p.comment})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {deliveryDate && mpDate && prices.length === 0 && (
        <p className="text-[11px] text-tg-hint mb-2">Нет доступных тарифов</p>
      )}

      {/* Quantity + Add */}
      {deliveryDate && mpDate && selectedPriceId && (
        <div className="mb-3 slide-up">
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            placeholder={selectedPrice ? `Укажите свой объем ` : "✏️ Кол-во м³"}
            className="w-full h-12 px-4 rounded-2xl bg-gradient-to-br from-tg-secondary-bg to-tg-secondary-bg border-0 outline-none text-tg-text text-sm mb-6 shadow-lg transition-all"
            style={{ boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)" }}
          />
          {qty && Number(qty) > 0 && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-bold transition-all transform active:scale-95 shadow-lg"
              style={{ boxShadow: "0 6px 20px rgba(34, 197, 94, 0.4)" }}
            >
              ✨ Добавить
            </button>
          )}
        </div>
      )}

      {/* Items list */}
      {items.length > 0 && (
        <div className="bg-tg-secondary-bg rounded-xl overflow-hidden mb-3 slide-up">
          {items.map((it, i) => (
            <div
              key={i}
              className="flex items-center px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text font-medium truncate">
                  {it.volume}
                </div>
                <div className="text-[11px] text-tg-hint">
                  {it.qty} × {it.price}
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
          <div
            className="flex justify-between items-center px-3 py-2"
            style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}
          >
            <span className="text-sm font-bold text-tg-text">Итого</span>
            <span className="text-sm font-bold text-tg-button">
              {total.toLocaleString("ru-RU")} ₽
            </span>
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
