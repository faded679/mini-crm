import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createRequest,
  getCities,
  getBoxTypes,
  getPalletTypes,
  getRates,
  getScheduleForCity,
  getClientServicePrices,
  type City,
  type BoxType,
  type PalletType,
  type PriceRate,
  type ScheduleEntry,
  type ClientServicePrice,
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
  const [searchParams] = useSearchParams();

  const [cities, setCities] = useState<City[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [rates, setRates] = useState<PriceRate[]>([]);
  const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
  const [clientServicePrices, setClientServicePrices] = useState<ClientServicePrice[]>([]);

  const [cityId, setCityId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [mpDate, setMpDate] = useState("");
  const [packaging, setPackaging] = useState<"pallets" | "boxes" | "">("");
  const [typeId, setTypeId] = useState<number | null>(null);
  const [qty, setQty] = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  
  // Client services toggles
  const [selectedClientServices, setSelectedClientServices] = useState<Set<number>>(new Set());
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deliveryTypeId, setDeliveryTypeId] = useState<number | null>(null);

  useEffect(() => {
    getCities().then(setCities).catch(() => {});
    getBoxTypes().then(setBoxTypes).catch(() => {});
    getPalletTypes().then(setPalletTypes).catch(() => {});
    getClientServicePrices("FBO").then(setClientServicePrices).catch(() => setClientServicePrices([]));
    
    // Set delivery type based on URL parameter
    const typeParam = searchParams.get("type");
    if (typeParam === "fbs") {
      setDeliveryTypeId(1); // FBS has id 1
    } else if (typeParam === "fbo") {
      setDeliveryTypeId(2); // FBO has id 2
    }
  }, [searchParams]);

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
    ? boxTypes.map((t) => ({ id: t.id, name: t.name, hint: t.hint }))
    : packaging === "pallets"
    ? palletTypes.map((t) => ({ id: t.id, name: t.name, hint: null as string | null | undefined }))
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

  const handleToggleClientService = (serviceId: number) => {
    setSelectedClientServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const total = items.reduce((s, it) => s + it.amount, 0);
  const clientServicesTotal = Array.from(selectedClientServices)
    .map((id) => clientServicePrices.find((s) => s.id === id))
    .filter((s) => s !== undefined)
    .reduce((sum, s) => sum + s.price, 0);
  const grandTotal = total + clientServicesTotal;

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
      
      const selectedClientServicesList = Array.from(selectedClientServices)
        .map((id) => clientServicePrices.find((s) => s.id === id))
        .filter((s): s is ClientServicePrice => s !== undefined);
      
      const allItems = [
        ...items.map((it) => ({
          description: `${selectedCity.fullName} ${it.packaging === "pallets" ? "Палета" : "Коробка"} — ${it.typeName}`,
          unit: it.packaging === "pallets" ? "пал" : "кор",
          quantity: it.qty,
          price: it.price,
          amount: it.amount,
        })),
        ...selectedClientServicesList.map((svc) => ({
          description: svc.name,
          unit: svc.unit,
          quantity: 1,
          price: svc.price,
          amount: svc.price,
        })),
      ];

      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: mainPkg,
        ...(mainBoxTypeId ? { boxTypeId: mainBoxTypeId } : {}),
        ...(deliveryTypeId ? { deliveryTypeId } : {}),
        ...(mpDate ? { mpAccountDate: mpDate } : {}),
        boxCount: totalQty,
        comment: items
          .map((it, i) => `${i + 1}. ${it.typeName} x${it.qty} = ${it.amount}₽`)
          .join("; ") + 
          (selectedClientServicesList.length > 0
            ? " | Услуги клиента: " + selectedClientServicesList.map((s) => s.name).join(", ")
            : "") +
          ` | Итого: ${grandTotal}₽`,
        items: allItems,
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
        <p className="text-base font-semibold text-white" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 0.6)' }}>
          {!cityId ? "Выберите направление" :
           !deliveryDate ? "Выберите дату" :
           !packaging ? "Выберите упаковку" :
           items.length === 0 ? "Добавьте товары" :
           "Отправьте заявку"}
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 px-3 py-2 rounded-lg mb-3 text-xs">{error}</div>
      )}

      {/* Direction & Date */}
      <div className={`flex gap-3 mb-3`}>
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            setCityId(e.target.value ? Number(e.target.value) : null);
            setDeliveryDate("");
            setMpDate("");
            setPackaging("");
            setTypeId(null);
            setQty("");
            setItems([]);
          }}
          className={`h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm appearance-none transition-all ${cityId ? "w-3/5" : "w-3/5"}`}
        >
          <option value="">📍 Направление</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </select>

        {cityId && (
          <select
            value={deliveryDate}
            onChange={(e) => {
              setDeliveryDate(e.target.value);
              setMpDate("");
              setPackaging("");
              setTypeId(null);
              setQty("");
            }}
            className="h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm slide-up w-2/5 min-w-0 appearance-none transition-all"
          >
            <option value="">Выбор даты</option>
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
      {cityId && !deliveryDate && schedule.length > 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-500 mb-2 slide-up text-right">⚠️ Дата выгрузки авто на маркетплейсе.</p>
      )}
      {/* MP delivery date */}

      {deliveryDate && (
        <div className="mb-3 slide-up">
          <input
            type="date"
            value={mpDate}
            onChange={(e) => setMpDate(e.target.value)}
            className="w-full h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm transition-all"
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

      {/* Packaging type */}
      {deliveryDate && mpDate && (
        <div className="mb-3 slide-up">
          <div className="grid grid-cols-2 gap-3">
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
              className={`py-3.5 rounded-2xl text-sm font-semibold transition-all active:opacity-70 ${
                packaging === p
                  ? "bg-tg-button text-tg-button-text border-2 border-gray-600"
                  : "bg-tg-secondary-bg text-tg-text border border-gray-700/20"
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
        <div className="mb-3 slide-up">
          <select
            value={typeId ?? ""}
            onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm transition-all"
          >
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          {typeId && (() => {
            const sel = typeOptions.find((t) => t.id === typeId);
            return sel?.hint ? (
              <p className="text-[11px] text-tg-hint mt-1">{sel.hint}</p>
            ) : null;
          })()}
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
            placeholder="✏️ Кол-во"
            className="w-full h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm mb-6 transition-all"
          />
          {qty && Number(qty) > 0 && (
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full h-12 rounded-2xl bg-green-600/80 text-white text-sm font-bold transition-all active:opacity-80"
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
            <div key={i} className="flex items-center px-3 py-2 border-b last:border-b-0" style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text font-medium truncate">
                  {it.packaging === "pallets" ? "Палета" : "Коробка"} · {it.typeName} x {it.qty}
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
          
          {/* Client Services Toggles */}
          {clientServicePrices.length > 0 && (
            <div className="px-3 py-2 border-t" style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}>
              <p className="text-xs text-tg-hint mb-2">Дополнительные услуги</p>
              {clientServicePrices.map((service) => {
                const isSelected = selectedClientServices.has(service.id);
                return (
                  <div
                    key={service.id}
                    onClick={() => handleToggleClientService(service.id)}
                    className="flex items-center py-2 cursor-pointer transition-all active:opacity-80"
                  >
                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        isSelected ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          isSelected ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </div>
                    <span className="ml-3 text-base text-tg-text font-medium">{service.name} — {service.price} ₽</span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="flex justify-between items-center px-3 py-2" style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}>
            <span className="text-sm font-bold text-tg-text">Итого</span>
            <span className="text-sm font-bold text-tg-button">{grandTotal.toLocaleString("ru-RU")} ₽</span>
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
