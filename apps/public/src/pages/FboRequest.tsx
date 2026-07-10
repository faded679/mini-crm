import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createWebRequest,
  getCities,
  getBoxTypes,
  getPalletTypes,
  getRates,
  getScheduleForCity,
  getClientServicePrices,
  getMe,
  type City,
  type BoxType,
  type PalletType,
  type PriceRate,
  type ScheduleEntry,
  type ClientServicePrice,
} from "../api";
import { getPhone, getToken } from "../auth";

interface LineItem {
  packaging: "pallets" | "boxes";
  typeName: string;
  typeId: number | null;
  qty: number;
  price: number;
  amount: number;
}

export default function FboRequest() {
  const navigate = useNavigate();

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
  const [selectedClientServices, setSelectedClientServices] = useState<Set<number>>(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [comment, setComment] = useState("");
  const [deliveryTypeId] = useState<number | null>(2); // FBO
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
    getCities().then(setCities).catch(() => {});
    getBoxTypes().then(setBoxTypes).catch(() => {});
    getPalletTypes().then(setPalletTypes).catch(() => {});
    getClientServicePrices("FBO").then(setClientServicePrices).catch(() => setClientServicePrices([]));
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
    setItems((prev) => [...prev, { packaging, typeName, typeId, qty: Number(qty), price, amount }]);
    setQty("");
    setTypeId(null);
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
  const totalBoxCount = items.reduce((s, it) => s + it.qty, 0);
  const clientServicesTotal = Array.from(selectedClientServices)
    .map((id) => clientServicePrices.find((s) => s.id === id))
    .filter((s) => s !== undefined)
    .reduce((sum, s) => {
      const isPickupService = s.name.includes("Забор груза");
      return sum + (isPickupService ? s.price : s.price * totalBoxCount);
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
        ...selectedClientServicesList.map((svc) => {
          const isPickupService = svc.name.includes("Забор груза");
          return {
            description: svc.name,
            unit: svc.unit,
            quantity: isPickupService ? 1 : totalQty,
            price: svc.price,
            amount: isPickupService ? svc.price : svc.price * totalQty,
          };
        }),
      ];

      const result = await createWebRequest({
        phone,
        city: selectedCity.shortName,
        deliveryDate: deliveryDate || new Date().toISOString(),
        packagingType: mainPkg,
        ...(mainBoxTypeId ? { boxTypeId: mainBoxTypeId } : {}),
        ...(deliveryTypeId ? { deliveryTypeId } : {}),
        ...(mpDate ? { mpAccountDate: mpDate } : {}),
        boxCount: totalQty,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
        /* comment: items
          .map((it, i) => `${i + 1}. ${it.typeName} x${it.qty} = ${it.amount}₽`)
          .join("; ") +
          (selectedClientServicesList.length > 0
            ? " | Услуги клиента: " + selectedClientServicesList.map((s) => {
              const isPickupService = s.name.includes("Забор груза");
              return isPickupService ? s.name : `${s.name} x${totalQty}`;
            }).join(", ")
            : "") +
          ` | Итого: ${grandTotal}₽`, */
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
        <button onClick={() => navigate("/")} className="text-accent text-sm font-medium">← Назад</button>
      </div>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <h1 className="text-heading text-lg font-bold mb-3">Заявка FBO</h1>

        <p className="text-muted text-xs mb-3">
          {!cityId ? "Выберите направление" : !deliveryDate ? "Выберите дату" : !packaging ? "Выберите упаковку" : items.length === 0 ? "Добавьте товары" : "Отправьте заявку"}
        </p>

        {error && <div className="bg-red-50 text-red-600 px-3 py-2 rounded-xl mb-3 text-xs">{error}</div>}

        <div className="flex gap-2.5 mb-3">
          <select
            value={cityId ?? ""}
            onChange={(e) => { setCityId(e.target.value ? Number(e.target.value) : null); setDeliveryDate(""); setMpDate(""); setPackaging(""); setTypeId(null); setQty(""); setItems([]); }}
            className="h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm appearance-none transition-all w-3/5 focus:border-accent"
          >
            <option value="">Направление</option>
            {cities.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </select>

          {cityId && (
            <select
              value={deliveryDate}
              onChange={(e) => { setDeliveryDate(e.target.value); setMpDate(""); setPackaging(""); setTypeId(null); setQty(""); }}
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

        {deliveryDate && (
          <div className="mb-3 slide-up">
            <input
              type="date"
              value={mpDate}
              onChange={(e) => setMpDate(e.target.value)}
              className="w-full h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm transition-all focus:border-accent"
            />
            <p className="text-[11px] text-muted mt-1">Дата поставки на маркетплейс в ЛК</p>
          </div>
        )}

        {deliveryDate && mpDate && (
          <div className="mb-3 slide-up">
            <div className="grid grid-cols-2 gap-2.5">
              {(["pallets", "boxes"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => { setPackaging(p); const opts = p === "boxes" ? boxTypes : palletTypes; setTypeId(opts.length > 0 ? opts[0].id : null); setQty(""); }}
                  className={`py-3 rounded-2xl text-sm font-semibold transition-all active:opacity-70 ${packaging === p ? "bg-accent text-white" : "bg-bg text-heading border border-gray-200"}`}
                >
                  {p === "pallets" ? "Палеты" : "Коробки"}
                </button>
              ))}
            </div>
          </div>
        )}

        {packaging && typeOptions.length > 0 && (
          <div className="mb-3 slide-up">
            <select
              value={typeId ?? ""}
              onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
              className="w-full h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm transition-all focus:border-accent"
            >
              {typeOptions.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {typeId && (() => {
              const sel = typeOptions.find((t) => t.id === typeId);
              return sel?.hint ? <p className="text-[11px] text-muted mt-1">{sel.hint}</p> : null;
            })()}
          </div>
        )}

        {packaging && (
          <div className="mb-3 slide-up">
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              placeholder="Кол-во"
              className="w-full h-11 px-3 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm mb-2 transition-all focus:border-accent"
            />
            {qty && Number(qty) > 0 && (
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
                <div className="text-sm text-heading font-medium truncate">
                  {it.packaging === "pallets" ? "Палета" : "Коробка"} · {it.typeName} x {it.qty}
                </div>
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
                          {service.name} — {service.price} ₽/кор
                          {totalBoxCount > 0 && (
                            <span className="text-xs text-muted ml-1">({Math.round(service.price * totalBoxCount * 100) / 100} ₽)</span>
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
