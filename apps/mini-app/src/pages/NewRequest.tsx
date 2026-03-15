import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRequest,
  getCities,
  getBoxTypes,
  getPalletTypes,
  getRates,
  getScheduleForCity,
  type City,
  type BoxType,
  type PalletType,
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
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);

  const [cityId, setCityId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [packaging, setPackaging] = useState<"pallets" | "boxes" | "">("");
  const [typeId, setTypeId] = useState<number | null>(null);
  const [qty, setQty] = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
    getBoxTypes().then(setBoxTypes).catch(() => {});
    getPalletTypes().then(setPalletTypes).catch(() => {});
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

  const typeOptions = packaging === "boxes"
    ? boxTypes.map((t) => ({ id: t.id, name: t.name }))
    : packaging === "pallets"
    ? palletTypes.map((t) => ({ id: t.id, name: t.name }))
    : [];

  const findPrice = useCallback(
    (pkg: "pallets" | "boxes", tId: number | null) => {
      if (!rates.length) return 0;
      const unit = pkg === "pallets" ? "pallet" : "boxes";
      const rate = rates.find((r) => {
        if (r.unit !== unit) return false;
        if (unit === "boxes") return r.boxTypeId === tId;
        if (unit === "pallet") return r.palletTypeId === tId;
        return false;
      });
      return rate?.price ?? 0;
    },
    [rates],
  );

  const handleAddItem = () => {
    if (!packaging || !qty || Number(qty) <= 0) return;
    const price = findPrice(packaging, typeId);
    const amount = price * Number(qty);
    const typeName =
      typeOptions.find((t) => t.id === typeId)?.name ?? (packaging === "pallets" ? "Палета" : "Коробка");

    setItems((prev) => [
      ...prev,
      { packaging, typeName, typeId, qty: Number(qty), price, amount },
    ]);
    setQty("");
    setTypeId(null);
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
      const mainBoxTypeId = mainPkg === "boxes" ? items[0].typeId ?? undefined : undefined;
      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: mainPkg,
        ...(mainBoxTypeId ? { boxTypeId: mainBoxTypeId } : {}),
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
      <div className="mb-3 text-center">
        <p className="text-sm font-medium text-tg-button">
          {!cityId ? "Выберите направление" :
           !deliveryDate ? "Выберите дату доставки" :
           !packaging ? "Выберите тип упаковки" :
           items.length === 0 ? "Добавьте товары в заявку" :
           "Проверьте данные и отправьте заявку"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>
      )}

      {/* Direction & Date */}
      <div className={`flex gap-2 mb-2.5`}>
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            setCityId(e.target.value ? Number(e.target.value) : null);
            setDeliveryDate("");
            setPackaging("");
            setTypeId(null);
            setQty("");
            setItems([]);
          }}
          className={`h-10 px-2 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm appearance-none ${cityId ? "w-3/5" : "w-3/5"}`}
        >
          <option value="">Направление</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </select>

        {cityId && (
          <select
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setPackaging("");
              setTypeId(null);
              setQty("");
            }}
            className="h-10 px-2 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm slide-up w-2/5 min-w-0 appearance-none"
          >
            <option value="">Дата</option>
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

      {/* Packaging type */}
      {deliveryDate && (
        <div className="mb-2.5 slide-up">
          <div className="grid grid-cols-2 gap-2">
          {(["pallets", "boxes"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => {
                setPackaging(p);
                const opts = p === "boxes"
                  ? boxTypes : palletTypes;
                setTypeId(opts.length > 0 ? opts[0].id : null);
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
        </div>
      )}

      {/* Type */}
      {packaging && typeOptions.length > 0 && (
        <div className="mb-2.5 slide-up">
          <select
            value={typeId ?? ""}
            onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-11 px-3 rounded-xl bg-tg-secondary-bg border-0 outline-none text-tg-text text-sm"
          >
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
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
          {qty && Number(qty) > 0 && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full h-11 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold transition active:scale-[0.97]"
            >
              + Добавить
            </button>
          )}
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
