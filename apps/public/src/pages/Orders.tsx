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
      palletTypeId: r.palletTypeId ? String(r.palletTypeId) : "",
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
    const req = requests.find((r) => r.id === id);
    const isFbs = req?.deliveryTypeId === 1;
    setSaving(true);
    setSaveError("");
    try {
      const patch: Parameters<typeof patchRequest>[1] = {
        deliveryDate: editState.deliveryDate || undefined,
        mpAccountDate: editState.mpAccountDate || null,
      };
      if (isFbs) {
        patch.volume = editState.volume ? Number(editState.volume) : undefined;
      } else {
        patch.packagingType = editState.packagingType;
        patch.boxCount = Number(editState.boxCount) > 0 ? Number(editState.boxCount) : undefined;
        if (editState.packagingType === "boxes") {
          patch.boxTypeId = editState.boxTypeId ? Number(editState.boxTypeId) : undefined;
          patch.palletTypeId = null;
        } else {
          patch.palletTypeId = editState.palletTypeId ? Number(editState.palletTypeId) : undefined;
          patch.boxTypeId = null;
        }
      }
      await patchRequest(id, patch);
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

                {isEditing && editState ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">Направление</span>
                      <span className="text-xs text-heading font-medium">{r.city}</span>
                    </div>

                    {isFbs ? (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted">Объём (м³)</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={editState.volume}
                            onChange={(e) => setEditState({ ...editState, volume: e.target.value.replace(",", ".") })}
                            placeholder="0.5"
                            className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200 w-20 text-right"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted">Упаковка</span>
                          <select
                            value={editState.packagingType}
                            onChange={(e) => setEditState({ ...editState, packagingType: e.target.value as "pallets" | "boxes", boxTypeId: "", palletTypeId: "" })}
                            className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200"
                          >
                            <option value="pallets">Палеты</option>
                            <option value="boxes">Коробки</option>
                          </select>
                        </div>

                        {editState.packagingType === "pallets" && palletTypes.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted">Тип палеты</span>
                            <select
                              value={editState.palletTypeId}
                              onChange={(e) => setEditState({ ...editState, palletTypeId: e.target.value })}
                              className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200"
                            >
                              <option value="">— выбрать —</option>
                              {palletTypes.map((pt) => (
                                <option key={pt.id} value={pt.id}>{pt.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        {editState.packagingType === "boxes" && boxTypes.length > 0 && (
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-muted">Тип коробки</span>
                            <select
                              value={editState.boxTypeId}
                              onChange={(e) => setEditState({ ...editState, boxTypeId: e.target.value })}
                              className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200"
                            >
                              <option value="">— выбрать —</option>
                              {boxTypes.map((bt) => (
                                <option key={bt.id} value={bt.id}>{bt.name}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted">Количество</span>
                          <input
                            type="number"
                            min="1"
                            value={editState.boxCount}
                            onChange={(e) => setEditState({ ...editState, boxCount: e.target.value })}
                            className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200 w-20 text-right"
                          />
                        </div>
                      </>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">Дата поставки</span>
                      <input
                        type="date"
                        value={editState.deliveryDate}
                        onChange={(e) => setEditState({ ...editState, deliveryDate: e.target.value })}
                        className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200"
                      />
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-muted">Дата МП/ЛК</span>
                      <input
                        type="date"
                        value={editState.mpAccountDate}
                        onChange={(e) => setEditState({ ...editState, mpAccountDate: e.target.value })}
                        className="text-xs font-medium bg-white text-heading rounded px-2 py-1 border border-gray-200"
                      />
                    </div>

                    {saveError && <p className="text-xs text-red-500">{saveError}</p>}

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-gray-100 text-heading text-xs font-semibold active:opacity-70 transition disabled:opacity-50"
                      >
                        Отмена
                      </button>
                      <button
                        onClick={() => handleSave(r.id)}
                        disabled={saving}
                        className="flex-1 py-2 rounded-xl bg-accent text-white text-xs font-semibold active:opacity-70 transition disabled:opacity-50"
                      >
                        {saving ? "Сохранение..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                ) : (
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
                      {isFbs ? (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted">Объём</span>
                          <span className="text-xs text-heading font-medium">{r.volume ? `${r.volume} м³` : "—"}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between">
                          <span className="text-xs text-muted">Тип груза</span>
                          <span className="text-xs text-heading font-medium">
                            {r.packagingType === "pallets" ? "Палеты" : "Коробки"}
                            {r.packagingType === "pallets" && r.palletType ? ` (${r.palletType.name})` : ""}
                            {r.packagingType === "boxes" && r.boxType ? ` (${r.boxType.name})` : ""}
                            {" "}× {r.boxCount}
                          </span>
                        </div>
                      )}
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

                    {r.status === "new" && !isEditing && (
                      <button
                        onClick={() => startEdit(r)}
                        className="w-full mt-3 py-2 rounded-xl bg-accent text-white text-xs font-semibold active:opacity-70 transition"
                      >
                        Редактировать
                      </button>
                    )}
                  </>
                )}

              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
