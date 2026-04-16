import { useEffect, useState } from "react";
import { getRequestsByPhone, getBoxTypes, getPalletTypes, patchRequest, type ShipmentRequest, type BoxType, type PalletType } from "../api";
import { getPhone, getToken } from "../auth";

const statusConfig: Record<string, { label: string; color: string }> = {
  new:       { label: "Новая",     color: "bg-blue-50 text-blue-700" },
  warehouse: { label: "Склад",     color: "bg-amber-50 text-amber-700" },
  shipped:   { label: "В пути",    color: "bg-purple-50 text-purple-700" },
  done:      { label: "Выполнена", color: "bg-green-50 text-green-700" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function toInputDate(iso: string | null | undefined) {
  if (!iso) return "";
  return new Date(iso).toISOString().slice(0, 10);
}

interface EditState {
  deliveryDate: string;
  packagingType: "pallets" | "boxes";
  boxCount: string;
  boxTypeId: string;
  palletTypeId: string;
  volume: string;
  mpAccountDate: string;
}

export default function Orders() {
  const [requests, setRequests] = useState<ShipmentRequest[]>([]);
  const [boxTypes, setBoxTypes] = useState<BoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<PalletType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadRequests = () => {
    const phone = getPhone();
    const token = getToken();
    if (!phone) { setLoading(false); return; }
    getRequestsByPhone(phone, token || undefined)
      .then((all) => setRequests(all.filter((r) => r.status !== "archived")))
      .catch((err) => console.error("loadRequests error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadRequests();
    getBoxTypes().then(setBoxTypes).catch(() => {});
    getPalletTypes().then(setPalletTypes).catch(() => {});
  }, []);

  const startEdit = (r: ShipmentRequest) => {
    setEditingId(r.id);
    setEditState({
      deliveryDate: toInputDate(r.deliveryDate),
      packagingType: r.packagingType,
      boxCount: String(r.boxCount),
      boxTypeId: r.boxTypeId ? String(r.boxTypeId) : "",
      palletTypeId: "",
      volume: r.volume ? String(r.volume) : "",
      mpAccountDate: toInputDate(r.mpAccountDate),
    });
    setSaveError("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditState(null);
    setSaveError("");
  };

  const handleSave = async (id: number) => {
    if (!editState) return;
    setSaving(true);
    setSaveError("");
    try {
      await patchRequest(id, {
        deliveryDate: editState.deliveryDate || undefined,
        packagingType: editState.packagingType,
        boxCount: Number(editState.boxCount) > 0 ? Number(editState.boxCount) : undefined,
        boxTypeId: editState.packagingType === "boxes" && editState.boxTypeId ? Number(editState.boxTypeId) : editState.packagingType === "pallets" ? null : undefined,
        palletTypeId: editState.packagingType === "pallets" && editState.palletTypeId ? Number(editState.palletTypeId) : undefined,
        volume: editState.volume ? Number(editState.volume) : undefined,
        mpAccountDate: editState.mpAccountDate || null,
      });
      setEditingId(null);
      setEditState(null);
      setLoading(true);
      loadRequests();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Ошибка сохранения");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center text-muted text-sm">Загрузка...</div>;
  }

  return (
    <div className="fade-in">
      <h1 className="text-heading text-[22px] font-bold mb-3">Заявки</h1>

      {requests.length === 0 ? (
        <section className="bg-card rounded-[22px] p-6 shadow-[0_10px_22px_rgba(39,56,74,0.1)] text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-muted text-sm">Заявок пока нет</p>
        </section>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => {
            const st = statusConfig[r.status] || statusConfig.new;
            const isEditing = editingId === r.id;
            const isFbs = r.deliveryTypeId === 1;

            return (
              <section key={r.id} className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-heading font-bold text-sm">Заявка #{r.id}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.color}`}>
                    {st.label}
                  </span>
                </div>

                {!isEditing ? (
                  <>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Направление</span>
                        <span className="text-xs text-heading font-medium">{r.city}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Дата поставки</span>
                        <span className="text-xs text-heading font-medium">{formatDate(r.deliveryDate)}</span>
                      </div>
                      {r.mpAccountDate && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted">Дата в л/к МП</span>
                          <span className="text-xs text-heading font-medium">{formatDate(r.mpAccountDate)}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-xs text-muted">Тип груза</span>
                        <span className="text-xs text-heading font-medium">
                          {r.packagingType === "pallets" ? "Палеты" : "Коробки"}
                          {r.packagingType === "boxes" && r.boxType ? ` (${r.boxType.name})` : ""}
                          {" "}× {r.boxCount}
                          {r.volume ? ` · ${r.volume} м³` : ""}
                        </span>
                      </div>
                      {r._totalAmount !== undefined && r._totalAmount > 0 && (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted">Сумма</span>
                          <span className="text-xs text-accent font-bold">{r._totalAmount.toLocaleString("ru-RU")} ₽</span>
                        </div>
                      )}
                      {r.comment && (
                        <div className="flex justify-between gap-3">
                          <span className="text-xs text-muted flex-shrink-0">Комментарий</span>
                          <span className="text-xs text-muted text-right break-words">{r.comment}</span>
                        </div>
                      )}
                    </div>

                    {r.status === "new" && (
                      <button
                        onClick={() => startEdit(r)}
                        className="mt-3 w-full h-9 rounded-xl border border-accent text-accent text-xs font-semibold transition active:bg-accent active:text-white"
                      >
                        Редактировать
                      </button>
                    )}
                  </>
                /* ) : editState && (
                  <div className="space-y-2 slide-up">
                    {!isFbs && (
                    <div>
                      <label className="text-xs text-muted block mb-1">Тип упаковки</label>
                      <div className="flex gap-2">
                        {(["pallets", "boxes"] as const).map((pt) => (
                          <button
                            key={pt}
                            onClick={() => setEditState({ ...editState, packagingType: pt, boxTypeId: "" })}
                            className={`flex-1 h-10 rounded-xl text-xs font-semibold border transition ${editState.packagingType === pt ? "bg-accent text-white border-accent" : "bg-bg border-gray-200 text-heading"}`}
                          >
                            {pt === "pallets" ? "Палеты" : "Коробки"}
                          </button>
                        ))}
                      </div>
                    </div>
                    )}
                    {!isFbs && editState.packagingType === "pallets" && palletTypes.length > 0 && (
                      <div>
                        <label className="text-xs text-muted block mb-1">Тип палет</label>
                        <select
                          value={editState.palletTypeId}
                          onChange={(e) => setEditState({ ...editState, palletTypeId: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent appearance-none"
                        >
                          <option value="">Не выбрано</option>
                          {palletTypes.map((pt) => (
                            <option key={pt.id} value={pt.id}>{pt.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    {!isFbs && editState.packagingType === "boxes" && boxTypes.length > 0 && (
                      <div>
                        <label className="text-xs text-muted block mb-1">Тип коробки</label>
                        <select
                          value={editState.boxTypeId}
                          onChange={(e) => setEditState({ ...editState, boxTypeId: e.target.value })}
                          className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent appearance-none"
                        >
                          <option value="">Не выбрано</option>
                          {boxTypes.map((bt) => (
                            <option key={bt.id} value={bt.id}>{bt.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted block mb-1">Дата поставки</label>
                      <input
                        type="date"
                        value={editState.deliveryDate}
                        onChange={(e) => setEditState({ ...editState, deliveryDate: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent"
                      />
                    </div>
                    {!isFbs && (
                    <div>
                      <label className="text-xs text-muted block mb-1">
                        Кол-во {editState.packagingType === "pallets" ? "палет" : "коробок"}
                      </label>
                      <input
                        type="number"
                        value={editState.boxCount}
                        onChange={(e) => setEditState({ ...editState, boxCount: e.target.value })}
                        min="1"
                        className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent"
                      />
                    </div>
                    )}
                    {isFbs && (
                      <div>
                        <label className="text-xs text-muted block mb-1">Объём (м³)</label>
                        <input
                          type="number"
                          value={editState.volume}
                          onChange={(e) => setEditState({ ...editState, volume: e.target.value })}
                          min="0.1"
                          step="0.1"
                          className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-xs text-muted block mb-1">Дата в л/к МП</label>
                      <input
                        type="date"
                        value={editState.mpAccountDate}
                        onChange={(e) => setEditState({ ...editState, mpAccountDate: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl bg-bg border border-gray-200 text-heading text-sm outline-none focus:border-accent"
                      />
                    </div>

                    {saveError && <p className="text-xs text-red-500">{saveError}</p>}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={cancelEdit}
                        className="flex-1 h-9 rounded-xl border border-gray-200 text-muted text-xs font-semibold"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleSave(r.id)}
                        disabled={saving}
                        className="flex-1 h-9 rounded-xl bg-accent text-white text-xs font-semibold disabled:opacity-50 transition active:bg-accent-dark"
                      >
                        {saving ? "Сохранение..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                )} */
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
