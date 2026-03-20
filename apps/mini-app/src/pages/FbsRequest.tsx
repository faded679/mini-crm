import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRequest,
  getCitiesFbs,
  getScheduleFbs,
  getPriceFbs,
  getClientServicePrices,
  type CityFbs,
  type ScheduleEntryFbs,
  type PriceFbsEntry,
  type ClientServicePrice,
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
  const [clientServicePrices, setClientServicePrices] = useState<ClientServicePrice[]>([]);

  const [cityId, setCityId] = useState<number | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
    const [selectedPriceId, setSelectedPriceId] = useState<number | null>(null);
  const [qty, setQty] = useState("");

  const [items, setItems] = useState<LineItem[]>([]);
  
  // Client services toggles
  const [selectedClientServices, setSelectedClientServices] = useState<Set<number>>(new Set());
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getCitiesFbs().then((data) => {
      setCities(data);
      const def = data.find((c) => c.shortName === "WB Курск FBS");
      if (def) setCityId(def.id);
    }).catch(() => {});
    getClientServicePrices("FBS").then(setClientServicePrices).catch(() => setClientServicePrices([]));
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
  const totalVolume = items.reduce((s, it) => s + it.qty, 0);
  const clientServicesTotal = Array.from(selectedClientServices)
    .map((id) => clientServicePrices.find((s) => s.id === id))
    .filter((s) => s !== undefined)
    .reduce((sum, s) => {
      // "Забор груза с адреса" - flat price, others - calculated by volume
      const isPickupService = s.name.includes("Забор груза");
      return sum + (isPickupService ? s.price : s.price * (totalVolume / 0.1));
    }, 0);
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
      
      const selectedClientServicesList = Array.from(selectedClientServices)
        .map((id) => clientServicePrices.find((s) => s.id === id))
        .filter((s): s is ClientServicePrice => s !== undefined);

      const clientServicesTotal = selectedClientServicesList.reduce((sum, s) => {
        const isPickupService = s.name.includes("Забор груза");
        return sum + (isPickupService ? s.price : s.price * (totalQty / 0.1));
      }, 0);
      const grandTotal = total + clientServicesTotal;

      const allItems = [
        ...items.map((it) => ({
          description: `${selectedCity.fullName}`,
          unit: "м³",
          quantity: it.qty,
          price: parseFloat(it.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0,
          amount: it.amount,
        })),
        ...selectedClientServicesList.map((svc) => {
          const isPickupService = svc.name.includes("Забор груза");
          return {
            description: svc.name,
            unit: svc.unit,
            quantity: isPickupService ? 1 : totalQty / 0.1,
            price: svc.price,
            amount: isPickupService ? svc.price : svc.price * (totalQty / 0.1),
          };
        }),
      ];

      await createRequest({
        telegramId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: "boxes",
        boxCount: totalQty,
        deliveryTypeId: 1, // FBS
        comment:
          items
            .map((it, i) => `${i + 1}. ${it.volume} x${it.qty} = ${it.amount}₽`)
            .join("; ") + 
          (selectedClientServicesList.length > 0
            ? " | Услуги клиента: " + selectedClientServicesList.map((s) => s.name).join(", ")
            : "") +
          ` | Итого: ${grandTotal.toLocaleString("ru-RU")}₽`,
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
        <p
          className="text-base font-semibold text-white"
          style={{ textShadow: "0 0 10px rgba(255, 255, 255, 0.6)" }}
        >
          {!cityId
            ? "Выберите направление"
            : !deliveryDate
            ? "Выберите дату"
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
            setQty("");
            setItems([]);
          }}
          className="h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm appearance-none transition-all w-3/5"
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
      {cityId && !deliveryDate && schedule.length > 0 && (
        <p className="text-[11px] text-amber-600 dark:text-amber-500 mb-2 slide-up text-right">⚠️ Дата выгрузки авто на маркетплейсе.</p>
      )}

      {/* Voume (from prise-fbs) */}
      {deliveryDate && prices.length > 0 && (
        <div className="mb-3 slide-up">
          <select
            value={selectedPriceId ?? ""}
            onChange={(e) => setSelectedPriceId(e.target.value ? Number(e.target.value) : null)}
            className="w-full h-12 px-4 rounded-2xl bg-tg-secondary-bg border border-gray-700/20 outline-none text-tg-text text-sm transition-all"
          >

            {prices.map((p) => (
              <option key={p.id} value={p.id}>
                {p.volume} — {p.price}{p.comment ? ` (${p.comment})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}
      {deliveryDate && prices.length === 0 && (
        <p className="text-[11px] text-tg-hint mb-2">Нет доступных тарифов</p>
      )}

      {/* Quantity + Add */}
      {deliveryDate && selectedPriceId && (
        <div className="mb-3 slide-up">
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            min="1"
            placeholder={selectedPrice ? `Укажите свой объем ` : "✏️ Кол-во м³"}
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
            <div
              key={i}
              className="flex items-center px-3 py-2 border-b last:border-b-0"
              style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-tg-text font-medium truncate">
                  {it.qty} м³ × {it.price}
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
                    <span className="ml-3 text-base text-tg-text font-medium">
                      {service.name.includes("Забор груза") ? (
                        <>{service.name} — {service.price} ₽</>
                      ) : (
                        <>
                          {service.name} — {service.price} ₽/0.1м³
                          {totalVolume > 0 && (
                            <span className="text-sm text-tg-hint ml-1">
                              ({Math.round(service.price * (totalVolume / 0.1) * 100) / 100} ₽)
                            </span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
          
          <div
            className="flex justify-between items-center px-3 py-2"
            style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}
          >
            <span className="text-sm font-bold text-tg-text">Итого</span>
            <span className="text-sm font-bold text-tg-button">
              {grandTotal.toLocaleString("ru-RU")} ₽
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
