import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  createRequest,
  getCities,
  getBoxTypes,
  getPalletTypes,
  getRates,
  type City,
  type BoxType,
  type PalletType,
  type PriceRate,
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

  const [cityId, setCityId] = useState<number | null>(null);
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
    } else {
      setRates([]);
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
        deliveryDate: new Date().toISOString(),
        packagingType: mainPkg,
        ...(mainBoxTypeId ? { boxTypeId: mainBoxTypeId } : {}),
        boxCount: totalQty,
        comment: items
          .map((it, i) => `${i + 1}. ${it.typeName} x${it.qty} = ${it.amount}₽`)
          .join("; ") + ` | Итого: ${total}₽`,
      });
      navigate("/history");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-tg-text mb-4">Новая заявка</h1>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
      )}

      {/* Direction */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1 text-tg-hint">Направление</label>
        <select
          value={cityId ?? ""}
          onChange={(e) => {
            setCityId(e.target.value ? Number(e.target.value) : null);
            setPackaging("");
            setTypeId(null);
            setQty("");
            setItems([]);
          }}
          className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
        >
          <option value="">Выберите направление</option>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </select>
      </div>

      {/* Packaging type */}
      <div className="mb-3">
        <label className="block text-sm font-medium mb-1 text-tg-hint">Упаковка</label>
        <div className="grid grid-cols-2 gap-3">
          {(["pallets", "boxes"] as const).map((p) => (
            <button
              key={p}
              type="button"
              disabled={!cityId}
              onClick={() => {
                setPackaging(p);
                setTypeId(null);
                setQty("");
              }}
              className={`p-3 rounded-lg font-medium transition disabled:opacity-40 ${
                packaging === p
                  ? "bg-tg-button text-tg-button-text"
                  : "bg-tg-secondary-bg text-tg-text"
              }`}
            >
              {p === "pallets" ? "Палеты" : "Коробки"}
            </button>
          ))}
        </div>
      </div>

      {/* Type */}
      {packaging && (
        <div className="mb-3">
          <label className="block text-sm font-medium mb-1 text-tg-hint">
            {packaging === "pallets" ? "Тип палет" : "Тип коробок"}
          </label>
          <select
            value={typeId ?? ""}
            onChange={(e) => setTypeId(e.target.value ? Number(e.target.value) : null)}
            className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
          >
            <option value="">Выберите тип</option>
            {typeOptions.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Quantity + Add button */}
      {packaging && (
        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1 text-tg-hint">Кол-во</label>
            <input
              type="number"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              min="1"
              placeholder="1"
              className="w-full p-3 rounded-lg bg-tg-secondary-bg border-0 outline-none text-tg-text"
            />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAddItem}
              disabled={!qty || Number(qty) <= 0}
              className="px-5 py-3 rounded-lg bg-tg-button text-tg-button-text font-medium disabled:opacity-40 transition"
            >
              + Добавить
            </button>
          </div>
        </div>
      )}

      {/* Items table */}
      {items.length > 0 && (
        <div className="bg-tg-secondary-bg rounded-xl overflow-hidden mb-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-tg-hint text-xs border-b border-tg-bg">
                <th className="py-2 px-2 text-left">№</th>
                <th className="py-2 px-2 text-left">Упаковка</th>
                <th className="py-2 px-2 text-left">Тип</th>
                <th className="py-2 px-2 text-right">Кол</th>
                <th className="py-2 px-2 text-right">Цена</th>
                <th className="py-2 px-2 text-right">Сумма</th>
                <th className="py-2 px-1"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, i) => (
                <tr key={i} className="border-b border-tg-bg last:border-b-0">
                  <td className="py-2 px-2 text-tg-text">{i + 1}</td>
                  <td className="py-2 px-2 text-tg-text">{it.packaging === "pallets" ? "Палета" : "Коробка"}</td>
                  <td className="py-2 px-2 text-tg-text">{it.typeName}</td>
                  <td className="py-2 px-2 text-right text-tg-text">{it.qty}</td>
                  <td className="py-2 px-2 text-right text-tg-text">{it.price}</td>
                  <td className="py-2 px-2 text-right text-tg-text font-medium">{it.amount}</td>
                  <td className="py-2 px-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(i)}
                      className="text-red-500 text-xs px-1"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between items-center px-3 py-2 border-t border-tg-bg">
            <span className="text-sm font-bold text-tg-text">Итого:</span>
            <span className="text-sm font-bold text-tg-text">{total.toLocaleString("ru-RU")} ₽</span>
          </div>
        </div>
      )}

      {/* Submit */}
      {items.length > 0 && (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 rounded-2xl bg-tg-button text-tg-button-text text-base font-semibold disabled:opacity-50 transition active:scale-[0.98]"
        >
          {submitting ? "Отправка..." : "Отправить заявку"}
        </button>
      )}
    </div>
  );
}
