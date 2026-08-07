import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  createWebRequest,
  getCitiesFbs,
  getScheduleFbs,
  getPriceFbs,
  getClientServicePrices,
  getMe,
  type CityFbs,
  type ScheduleEntryFbs,
  type PriceFbsEntry,
  type ClientServicePrice,
} from "../api";
import { getPhone, getToken } from "../auth";
import { resolveRequestOrg } from "../orgContext";

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
  const [selectedClientServices, setSelectedClientServices] = useState<Set<number>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [isBlocked, setIsBlocked] = useState(false);
  const [checkingBlock, setCheckingBlock] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (token) {
      setCheckingBlock(true);
      getMe(token)
        .then((data) => setIsBlocked(data.isBlocked))
        .catch(() => setIsBlocked(false))
        .finally(() => setCheckingBlock(false));
    } else {
      setCheckingBlock(false);
    }
  }, []);

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
    if (!selectedPrice || !qty || Number(qty) < 0.1) return;
    const priceNum = parseFloat(selectedPrice.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    const volNum = parseFloat(selectedPrice.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
    const units = Number(qty) / volNum;
    const amount = Math.round(priceNum * units * 100) / 100;
    setItems((prev) => [
      ...prev,
      { volume: selectedPrice.volume, price: selectedPrice.price, qty: Number(qty), amount },
    ]);
    setQty("");
  };

  const handleRemoveItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleToggleClientService = (serviceId: number) => {
    setSelectedClientServices((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) newSet.delete(serviceId);
      else newSet.add(serviceId);
      return newSet;
    });
  };

  const total = items.reduce((s, it) => s + it.amount, 0);
  const totalVolume = items.reduce((s, it) => s + it.qty, 0);
  const clientServicesTotal = Array.from(selectedClientServices)
    .map((id) => clientServicePrices.find((s) => s.id === id))
    .filter((s) => s !== undefined)
    .reduce((sum, s) => {
      const isPickupService = s.name.includes("Забор груза");
      return sum + (isPickupService ? s.price : s.price * (totalVolume / 0.1));
    }, 0);
  const grandTotal = total + clientServicesTotal;

  const handleSubmit = async () => {
    if (!selectedCity || items.length === 0) return;
    if (isBlocked) {
      setError("Ваш аккаунт заблокирован для создания новых заявок");
      return;
    }
    const phone = getPhone();
    if (!phone) {
      setError("Не удалось получить данные авторизации");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const org = await resolveRequestOrg();
      if (org.status === "need_pick") {
        window.location.href = "/";
        return;
      }
      const counterpartyId = org.counterpartyId;

      const totalQty = items.reduce((s, it) => s + it.qty, 0);

      const selectedClientServicesList = Array.from(selectedClientServices)
        .map((id) => clientServicePrices.find((s) => s.id === id))
        .filter((s): s is ClientServicePrice => s !== undefined);

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

      const result = await createWebRequest({
        phone,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: "boxes",
        boxCount: totalQty,
        volume: totalVolume,
        deliveryTypeId: 1,
        ...(counterpartyId ? { counterpartyId } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        items: allItems,
      });
      navigate(`/success/${result.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="mb-4">
        <button onClick={() => navigate("/")} className="text-accent text-sm font-medium">
          ← Назад
        </button>
      </div>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <h1 className="text-heading text-lg font-bold mb-3">Заявка FBS</h1>

        <p className="text-muted text-xs mb-3">
          {!cityId ? "Выберите направление" : !deliveryDate ? "Выберите дату" : items.length === 0 ? "Укажите кол-во кубов" : "Отправьте заявку"}
        </p>

        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl mb-3 text-xs">{error}</div>}

        <div className="flex gap-2.5 mb-3">
          <select
            value={cityId ?? ""}
            onChange={(e) => { setCityId(e.target.value ? Number(e.target.value) : null); setDeliveryDate(""); setQty(""); setItems([]); }}
            className="h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm appearance-none transition-all w-3/5 focus:border-accent"
          >
            {cities.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </select>

          {cityId && (
            <select
              value={deliveryDate}
              onChange={(e) => { setDeliveryDate(e.target.value); setQty(""); }}
              className="h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm slide-up w-2/5 min-w-0 appearance-none transition-all focus:border-accent"
            >
              <option value="">Дата</option>
              {schedule.map((s) => (
                <option key={s.id} value={s.deliveryDate}>
                  {new Date(s.deliveryDate).toLocaleDateString("ru-RU", { day: "numeric", month: "long", weekday: "short" })}
                </option>
              ))}
            </select>
          )}
        </div>

        {deliveryDate && prices.length > 0 && (
          <div className="mb-3 slide-up">
            <select
              value={selectedPriceId ?? ""}
              onChange={(e) => setSelectedPriceId(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm transition-all focus:border-accent"
            >
              {prices.map((p) => (
                <option key={p.id} value={p.id}>{p.volume} — {p.price}{p.comment ? ` (${p.comment})` : ""}</option>
              ))}
            </select>
          </div>
        )}

        {deliveryDate && selectedPriceId && (
          <div className="mb-3 slide-up">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="0.1"
              step="0.1"
              placeholder="Укажите свой объем (мин. 0.1 м³)"
              className="w-full h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm mb-1 transition-all focus:border-accent"
            />
            <p className="text-xs text-muted mb-2 px-1">Минимальный объём — 0.1 м³</p>
            {qty && Number(qty) >= 0.1 && (
              <button onClick={handleAddItem} className="w-full h-11 rounded-2xl bg-green-600 text-white text-sm font-bold transition active:opacity-80">
                Добавить
              </button>
            )}
          </div>
        )}
      </section>

      {items.length > 0 && (
        <section className="bg-card rounded-[22px] overflow-hidden shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 slide-up">
          {items.map((it, i) => (
            <div key={i} className="flex items-center px-4 py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-heading font-medium">{it.qty} м³ × {it.price}</div>
              </div>
              <span className="text-sm font-semibold text-heading ml-2 whitespace-nowrap">{it.amount.toLocaleString("ru-RU")} ₽</span>
              <button onClick={() => handleRemoveItem(i)} className="ml-2 w-6 h-6 flex items-center justify-center rounded-full text-red-400 hover:bg-red-50 text-xs">✕</button>
            </div>
          ))}

          {clientServicePrices.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-muted mb-2">Дополнительные услуги</p>
              {clientServicePrices.map((service) => {
                const isSelected = selectedClientServices.has(service.id);
                return (
                  <div key={service.id} onClick={() => handleToggleClientService(service.id)} className="flex items-center py-2 cursor-pointer transition-all active:opacity-80">
                    <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isSelected ? 'bg-green-500' : 'bg-gray-300'}`}>
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isSelected ? 'translate-x-6' : 'translate-x-1'}`} />
                    </div>
                    <span className="ml-3 text-sm text-heading font-medium">
                      {service.name.includes("Забор груза") ? (
                        <>{service.name} — {service.price} ₽</>
                      ) : (
                        <>
                          {service.name} — {service.price} ₽/0.1м³
                          {totalVolume > 0 && (
                            <span className="text-xs text-muted ml-1">({Math.round(service.price * (totalVolume / 0.1) * 100) / 100} ₽)</span>
                          )}
                        </>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center px-4 py-3 bg-bg">
            <span className="text-sm font-bold text-heading">Итого</span>
            <span className="text-sm font-bold text-accent">{grandTotal.toLocaleString("ru-RU")} ₽</span>
          </div>
        </section>
      )}

      {items.length > 0 && (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            placeholder="Комментарий к заявке (необязательно)..."
            className="w-full px-3 py-2.5 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm resize-none transition-all focus:border-accent"
          />
          {isBlocked && (
            <p className="text-sm text-red-600 bg-red-50 rounded-2xl p-3">
              Создание заявок заблокировано. Согласно правилам нашего сервиса, ваш аккаунт ограничен для создания новых заявок.
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting || isBlocked || checkingBlock}
            className="w-full py-3 rounded-2xl bg-accent text-white text-sm font-semibold disabled:opacity-50 transition active:bg-accent-dark"
          >
            {submitting ? "Отправка..." : isBlocked ? "Создание заявок заблокировано" : "Отправить заявку"}
          </button>
        </>
      )}
    </div>
  );
}
