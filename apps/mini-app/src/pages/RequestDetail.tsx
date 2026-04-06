import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRequestDetail, updateRequest, type ShipmentRequestDetail } from "../api";

const statusConfig: Record<string, { label: string; bg: string }> = {
  new:       { label: "Новая",     bg: "bg-blue-50 text-blue-700" },
  warehouse: { label: "Склад",     bg: "bg-amber-50 text-amber-700" },
  shipped:   { label: "В пути",    bg: "bg-purple-50 text-purple-700" },
  done:      { label: "Выполнена", bg: "bg-green-50 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<ShipmentRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({
    deliveryDate: "",
    packagingType: "pallets" as "pallets" | "boxes",
    volume: 0,
    boxCount: 1,
    mpAccountDate: "",
  });
  const [volumeInput, setVolumeInput] = useState("");

  useEffect(() => {
    if (!id) return;
    loadRequest();
  }, [id]);

  const loadRequest = () => {
    if (!id) return;
    setLoading(true);
    getRequestDetail(Number(id))
      .then((req) => {
        setRequest(req);
        setEditData({
          deliveryDate: req.deliveryDate.split("T")[0],
          packagingType: req.packagingType,
          volume: req.volume || 0,
          boxCount: req.boxCount,
          mpAccountDate: req.mpAccountDate?.split("T")[0] || "",
        });
        setVolumeInput(req.volume ? String(req.volume) : "");
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Ошибка"))
      .finally(() => setLoading(false));
  };

  const handleSave = async () => {
    if (!id || !request) return;
    setSaving(true);
    try {
      const isFBS = request.deliveryTypeId === 1;
      await updateRequest(Number(id), {
        deliveryDate: editData.deliveryDate,
        ...(isFBS ? { volume: editData.volume } : { packagingType: editData.packagingType, boxCount: editData.boxCount }),
        mpAccountDate: editData.mpAccountDate || undefined,
      });
      await loadRequest();
      setEditing(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh] text-tg-hint text-sm">Загрузка...</div>;
  }

  if (error || !request) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 fade-in">
        <div className="text-3xl mb-3">😔</div>
        <p className="text-tg-hint text-sm mb-4">{error || "Заявка не найдена"}</p>
        <button
          onClick={() => navigate("/history")}
          className="px-5 py-2.5 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold"
        >
          Назад
        </button>
      </div>
    );
  }

  const st = statusConfig[request.status] || statusConfig.new;
  const total = request.services.reduce((s, srv) => s + srv.amount, 0);

  return (
    <div className="px-3 pt-3 pb-24 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-tg-text">Заявка #{request.id}</h1>
        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${st.bg}`}>
          {st.label}
        </span>
      </div>

      {/* Info card */}
      <div className="bg-tg-secondary-bg rounded-xl px-3 py-3 mb-3 space-y-2">
        <Row label="Направление" value={request.city} />
        
        {editing ? (
          <>
            {request.deliveryTypeId === 1 ? (
              <div className="flex justify-between items-center">
                <span className="text-xs text-tg-hint">Объём (м³)</span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={volumeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(",", ".");
                    setVolumeInput(val);
                    const num = parseFloat(val);
                    if (!isNaN(num) && num > 0) {
                      setEditData({ ...editData, volume: num });
                    }
                  }}
                  placeholder="0.5"
                  className="text-sm font-medium bg-tg-bg text-tg-text rounded px-2 py-1 border border-tg-hint w-20 text-right"
                />
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-tg-hint">Упаковка</span>
                  <select
                    value={editData.packagingType}
                    onChange={(e) => setEditData({ ...editData, packagingType: e.target.value as "pallets" | "boxes" })}
                    className="text-sm font-medium bg-tg-bg text-tg-text rounded px-2 py-1 border border-tg-hint"
                  >
                    <option value="pallets">Палеты</option>
                    <option value="boxes">Коробки</option>
                  </select>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-tg-hint">Кол-во</span>
                  <input
                    type="number"
                    min="1"
                    value={editData.boxCount}
                    onChange={(e) => setEditData({ ...editData, boxCount: Number(e.target.value) })}
                    className="text-sm font-medium bg-tg-bg text-tg-text rounded px-2 py-1 border border-tg-hint w-20 text-right"
                  />
                </div>
              </>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-tg-hint">Дата доставки</span>
              <input
                type="date"
                value={editData.deliveryDate}
                onChange={(e) => setEditData({ ...editData, deliveryDate: e.target.value })}
                className="text-sm font-medium bg-tg-bg text-tg-text rounded px-2 py-1 border border-tg-hint"
              />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-tg-hint">Дата МП ЛК</span>
              <input
                type="date"
                value={editData.mpAccountDate}
                onChange={(e) => setEditData({ ...editData, mpAccountDate: e.target.value })}
                className="text-sm font-medium bg-tg-bg text-tg-text rounded px-2 py-1 border border-tg-hint"
              />
            </div>
          </>
        ) : (
          <>
            {request.deliveryTypeId === 1 ? (
              <Row label="Объём" value={request.volume ? `${request.volume} м³` : "—"} />
            ) : (
              <>
                <Row label="Упаковка" value={request.packagingType === "pallets" ? "Палеты" : "Коробки"} />
                <Row label="Кол-во" value={String(request.boxCount)} />
                {request.boxType && <Row label="Тип" value={request.boxType.name} />}
              </>
            )}
            {request.weight && <Row label="Вес" value={`${request.weight} кг`} />}
            <Row label="Дата доставки" value={formatDate(request.deliveryDate)} />
            {request.mpAccountDate && <Row label="Дата МП ЛК" value={formatDate(request.mpAccountDate)} />}
            <Row label="Создана" value={formatDate(request.createdAt)} />
          </>
        )}
      </div>

      {/* Edit buttons */}
      {!editing && request.status === "new" && (
        <button
          onClick={() => setEditing(true)}
          className="w-full mb-3 py-2.5 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold active:opacity-70 transition"
        >
          Редактировать
        </button>
      )}

      {editing && (
        <div className="flex gap-2 mb-3">
          <button
            onClick={() => setEditing(false)}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-tg-secondary-bg text-tg-text text-sm font-semibold active:opacity-70 transition disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-tg-button text-tg-button-text text-sm font-semibold active:opacity-70 transition disabled:opacity-50"
          >
            {saving ? "Сохранение..." : "Сохранить"}
          </button>
        </div>
      )}

      {/* Services */}
      {!editing && request.services.length > 0 && (
        <div>
          <h2 className="text-sm font-bold text-tg-text mb-2">Услуги</h2>
          <div className="bg-tg-secondary-bg rounded-xl overflow-hidden">
            {request.services.map((srv) => (
              <div key={srv.id} className="px-3 py-2.5 border-b last:border-b-0" style={{ borderColor: "var(--tg-theme-bg-color, #fff)" }}>
                <div className="text-sm text-tg-text leading-snug mb-1">{srv.description}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-tg-hint">
                    {srv.quantity} {srv.unit} × {srv.price.toLocaleString("ru-RU")} ₽
                  </span>
                  <span className="text-sm font-semibold text-tg-text">
                    {srv.amount.toLocaleString("ru-RU")} ₽
                  </span>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center px-3 py-2.5" style={{ backgroundColor: "var(--tg-theme-bg-color, #fff)" }}>
              <span className="text-sm font-bold text-tg-text">Итого</span>
              <span className="text-sm font-bold text-tg-button">{total.toLocaleString("ru-RU")} ₽</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-tg-hint">{label}</span>
      <span className="text-sm font-medium text-tg-text">{value}</span>
    </div>
  );
}
