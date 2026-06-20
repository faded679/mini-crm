import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { createCarrier } from "../api";
import { ArrowLeft, Check, Truck } from "lucide-react";

export default function CarrierForm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const city = searchParams.get("city") || "";
  const date = searchParams.get("date") || "";
  const type = searchParams.get("type") || "fbo";
  const ids = searchParams.get("ids") || "";
  const requestIds = ids.split(",").map(Number).filter(Boolean);

  const [carBrand, setCarBrand] = useState("");
  const [carNumber, setCarNumber] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [logistInfo, setLogistInfo] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!carBrand.trim() || !carNumber.trim() || !driverName.trim() || !driverPhone.trim()) {
      setError("Заполните все обязательные поля");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const record = await createCarrier({
        carBrand: carBrand.trim(),
        carNumber: carNumber.trim(),
        driverName: driverName.trim(),
        driverPhone: driverPhone.trim(),
        logistInfo: logistInfo.trim() || undefined,
        city,
        deliveryDate: date,
        deliveryType: type,
        comment: comment.trim() || undefined,
        requestIds,
      });
      navigate(`/success/${record.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-slate-100 pb-10">
      {/* Header */}
      <div className="bg-blue-600 px-4 pt-10 pb-5">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-200 flex items-center gap-1 mb-3 text-sm"
        >
          <ArrowLeft size={16} /> Назад
        </button>
        <h1 className="text-white font-bold text-lg">Данные перевозчика</h1>
        <p className="text-blue-200 text-sm">
          {city} · {date ? formatDate(date) : ""} · {type.toUpperCase()} · {requestIds.length} заяв.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase flex items-center gap-1.5">
            <Truck size={14} /> Автомобиль
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Марка машины <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={carBrand}
              onChange={(e) => setCarBrand(e.target.value)}
              required
              placeholder="Например: Газель, MAN, Volvo"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Гос. номер <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value.toUpperCase())}
              required
              placeholder="А123БВ77"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base uppercase"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase">Водитель</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              ФИО водителя <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              required
              placeholder="Иванов Иван Иванович"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Телефон водителя <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              required
              placeholder="+7 900 000 00 00"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
          <p className="text-xs font-semibold text-gray-400 uppercase">Дополнительно</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Данные логиста
            </label>
            <input
              type="text"
              value={logistInfo}
              onChange={(e) => setLogistInfo(e.target.value)}
              placeholder="ФИО логиста, контакт..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Комментарий
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Дополнительная информация..."
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-50 active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          {saving ? (
            "Сохранение..."
          ) : (
            <>
              <Check size={20} />
              Привязать к {requestIds.length} заяв.
            </>
          )}
        </button>
      </form>
    </div>
  );
}
