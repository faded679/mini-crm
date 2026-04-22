import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getWarehouseRequestById,
  updateWarehouseVolume,
  updateWarehousePackaging,
  updateWarehousePackagingType,
  moveWarehouseToWarehouse,
  uploadWarehousePhoto,
  deleteWarehousePhoto,
  addWarehouseService,
  deleteWarehouseService,
  getWarehouseBoxTypes,
  getWarehousePalletTypes,
  getWarehouseServicePrices,
  updateWarehouseComment,
  addWarehouseBoxLine,
  type WarehouseRequest,
  type WHBoxType,
  type WHPalletType,
  type WHServicePrice,
} from "../api";

const API_URL = import.meta.env.VITE_API_URL || "https://sologo.ru/api";

function getOrgName(req: WarehouseRequest): string {
  const cp = req.client?.counterparties?.[0]?.counterparty;
  if (!cp) return "—";
  const name = cp.shortName || cp.name || "";
  const m = name.match(/^(ИП)\s+([А-ЯЁ][а-яё]+)/i);
  return m ? `${m[1]} ${m[2]}` : name;
}

function getPhotoUrl(photo: { fileId: string; fileUrl: string | null }): string {
  if (photo.fileUrl && photo.fileUrl.startsWith("/uploads/")) {
    return `${API_URL}${photo.fileUrl}`;
  }
  if (photo.fileId && !photo.fileId.startsWith("upload:")) {
    return `${API_URL}/admin/requests/0/photo/${photo.fileId}`;
  }
  return "";
}

type Modal = null | "volume" | "boxCount" | "packaging" | "boxType" | "palletType" | "service" | "serviceQty" | "confirm_warehouse" | "comment" | "addBoxLine" | "addBoxLineQty";

export default function WarehouseRequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [req, setReq] = useState<WarehouseRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [inputValue, setInputValue] = useState("");
  const [boxTypes, setBoxTypes] = useState<WHBoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<WHPalletType[]>([]);
  const [servicePrices, setServicePrices] = useState<WHServicePrice[]>([]);
  const [selectedService, setSelectedService] = useState<WHServicePrice | null>(null);
  const [commentValue, setCommentValue] = useState("");
  const [addLineType, setAddLineType] = useState<{ id: number; name: string; kind: "box" | "pallet" } | null>(null);
  const [addLineQty, setAddLineQty] = useState("1");

  const loadRequest = () => {
    if (!id) return;
    setLoading(true);
    getWarehouseRequestById(Number(id))
      .then(setReq)
      .catch(() => setReq(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadRequest(); }, [id]);
  useEffect(() => {
    getWarehouseBoxTypes().then(setBoxTypes).catch(() => {});
    getWarehousePalletTypes().then(setPalletTypes).catch(() => {});
    getWarehouseServicePrices().then(setServicePrices).catch(() => {});
  }, []);

  if (loading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Загрузка...</div>;
  if (!req) return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400">Заявка не найдена</div>;

  const isFbs = req.deliveryType?.name === "FBS";
  const photos = req.photos || [];
  const services = req.services || [];

  const handleSaveVolume = async () => {
    const v = parseFloat(inputValue.replace(",", "."));
    if (!v || v <= 0) return;
    setBusy(true);
    try { await updateWarehouseVolume(req.id, v); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleSaveBoxCount = async () => {
    const c = parseInt(inputValue, 10);
    if (!c || c <= 0) return;
    setBusy(true);
    try { await updateWarehousePackaging(req.id, { boxCount: c }); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleChangePackaging = async (type: "boxes" | "pallets") => {
    setBusy(true);
    try { await updateWarehousePackagingType(req.id, type); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleSelectBoxType = async (btId: number) => {
    setBusy(true);
    try { await updateWarehousePackaging(req.id, { boxTypeId: btId }); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleSelectPalletType = async (ptId: number) => {
    setBusy(true);
    try { await updateWarehousePackaging(req.id, { palletTypeId: ptId }); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        await uploadWarehousePhoto(req.id, file);
      }
      loadRequest();
    } catch (err: any) { alert(err.message); }
    setBusy(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDeletePhoto = async (photoId: number) => {
    if (!confirm("Удалить фото?")) return;
    setBusy(true);
    try { await deleteWarehousePhoto(req.id, photoId); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleAddService = async () => {
    if (!selectedService) return;
    const qty = parseInt(inputValue, 10);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try { await addWarehouseService(req.id, selectedService.id, qty); setModal(null); setSelectedService(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleDeleteService = async (svcId: number) => {
    if (!confirm("Удалить услугу?")) return;
    setBusy(true);
    try { await deleteWarehouseService(req.id, svcId); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleToWarehouse = async () => {
    setBusy(true);
    try { await moveWarehouseToWarehouse(req.id); setModal(null); navigate("/warehouse/new"); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleSaveComment = async () => {
    setBusy(true);
    try { await updateWarehouseComment(req.id, commentValue.trim() || null); setModal(null); loadRequest(); } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const handleAddBoxLine = async () => {
    if (!addLineType) return;
    const qty = parseInt(addLineQty, 10);
    if (!qty || qty <= 0) return;
    setBusy(true);
    try {
      await addWarehouseBoxLine(req.id, {
        ...(addLineType.kind === "box" ? { boxTypeId: addLineType.id } : { palletTypeId: addLineType.id }),
        quantity: qty,
      });
      setModal(null);
      setAddLineType(null);
      setAddLineQty("1");
      loadRequest();
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-4">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => navigate("/warehouse/new")} className="text-2xl leading-none">←</button>
        <h1 className="font-bold text-gray-900">Заявка #{req.id}</h1>
        <span className={`ml-auto px-2 py-0.5 rounded text-xs font-medium ${
          isFbs ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
        }`}>
          {req.deliveryType?.name || "FBO"}
        </span>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {/* Info card */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-400">Организация</span><span className="font-medium text-gray-900">{getOrgName(req)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Направление</span><span className="font-medium text-gray-900">{req.cityRef?.shortName || req.city}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-400">Дата доставки</span><span className="font-medium text-gray-900">{new Date(req.deliveryDate).toLocaleDateString("ru-RU")}</span></div>
          {isFbs ? (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Объём</span>
              <span className="font-medium text-gray-900">{req.volume ? `${req.volume} м³` : "не указан"}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Упаковка</span><span className="font-medium text-gray-900">{req.packagingType === "pallets" ? "Палеты" : "Коробки"}</span></div>
              {req.packagingType === "boxes" && req.boxType && (
                <div className="flex justify-between text-sm"><span className="text-gray-400">Тип коробки</span><span className="font-medium text-gray-900">{req.boxType.name}</span></div>
              )}
              {req.packagingType === "pallets" && req.palletType && (
                <div className="flex justify-between text-sm"><span className="text-gray-400">Тип палеты</span><span className="font-medium text-gray-900">{req.palletType.name}</span></div>
              )}
              <div className="flex justify-between text-sm"><span className="text-gray-400">Количество</span><span className="font-medium text-gray-900">{req.boxCount} шт</span></div>
            </>
          )}
          {/* Comment */}
          <div className="pt-1 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">Комментарий</span>
              <button
                onClick={() => { setCommentValue(req.comment || ""); setModal("comment"); }}
                className="text-xs text-blue-600 font-medium"
              >{req.comment ? "Изменить" : "+ Добавить"}</button>
            </div>
            {req.comment && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{req.comment}</p>}
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">📸 Фото ({photos.length})</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="text-xs text-blue-600 font-medium disabled:opacity-50"
            >
              + Добавить
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handlePhotoCapture} />
          </div>
          {photos.length > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              {photos.map((p) => {
                const url = getPhotoUrl(p);
                return (
                  <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                    {url ? (
                      <img src={url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">нет</div>
                    )}
                    <button
                      onClick={() => handleDeletePhoto(p.id)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >✕</button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Нет фото</div>
          )}
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">✨ Доп. услуги ({services.length})</span>
            <button onClick={() => setModal("service")} className="text-xs text-blue-600 font-medium">+ Добавить</button>
          </div>
          {services.length > 0 ? (
            <div className="space-y-1">
              {services.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-700">{s.description} ×{s.quantity}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{s.amount} ₽</span>
                    <button onClick={() => handleDeleteService(s.id)} className="text-red-400 hover:text-red-600">✕</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-400">Нет услуг</div>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-2">
          {isFbs ? (
            <button onClick={() => { setInputValue(req.volume?.toString() || ""); setModal("volume"); }} className="w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50">
              ✏️ Указать объём
            </button>
          ) : (
            <>
              <button onClick={() => setModal("packaging")} className="w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50">
                📦 {req.packagingType === "pallets" ? "Палеты → Коробки" : "Коробки → Палеты"}
              </button>
              <button onClick={() => { setModal(req.packagingType === "boxes" ? "boxType" : "palletType"); }} className="w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50">
                📏 Изменить размер
              </button>
              <button onClick={() => { setAddLineQty("1"); setModal("addBoxLine"); }} className="w-full bg-white border border-blue-200 rounded-xl py-3 text-sm font-medium text-blue-700 active:bg-blue-50">
                ➕ Добавить тип коробки
              </button>
              <button onClick={() => { setInputValue(String(req.boxCount)); setModal("boxCount"); }} className="w-full bg-white border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-700 active:bg-gray-50">
                ✏️ Изменить кол-во
              </button>
            </>
          )}

          <button
            onClick={() => setModal("confirm_warehouse")}
            disabled={busy}
            className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl py-4 text-base font-semibold transition shadow-sm disabled:opacity-50"
          >
            ✅ На склад
          </button>
        </div>
      </div>

      {/* Modals */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => !busy && setModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>

            {modal === "volume" && (
              <>
                <h3 className="font-bold text-gray-900">Указать объём (м³)</h3>
                <input type="text" inputMode="decimal" value={inputValue} onChange={(e) => setInputValue(e.target.value.replace(",", "."))} placeholder="2.5" autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
                <button onClick={handleSaveVolume} disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Сохранить</button>
              </>
            )}

            {modal === "boxCount" && (
              <>
                <h3 className="font-bold text-gray-900">Количество</h3>
                <input type="number" inputMode="numeric" min="1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
                <button onClick={handleSaveBoxCount} disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Сохранить</button>
              </>
            )}

            {modal === "packaging" && (
              <>
                <h3 className="font-bold text-gray-900">Сменить тип упаковки</h3>
                <p className="text-sm text-gray-500">Текущий: {req.packagingType === "pallets" ? "Палеты" : "Коробки"}</p>
                <button
                  onClick={() => handleChangePackaging(req.packagingType === "pallets" ? "boxes" : "pallets")}
                  disabled={busy}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50"
                >
                  Изменить на {req.packagingType === "pallets" ? "Коробки" : "Палеты"}
                </button>
              </>
            )}

            {modal === "boxType" && (
              <>
                <h3 className="font-bold text-gray-900">Тип коробки</h3>
                <div className="space-y-2">
                  {boxTypes.map((bt) => (
                    <button key={bt.id} onClick={() => handleSelectBoxType(bt.id)} disabled={busy}
                      className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-100 disabled:opacity-50">
                      {bt.name} {bt.hint || ""}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal === "palletType" && (
              <>
                <h3 className="font-bold text-gray-900">Тип палеты</h3>
                <div className="space-y-2">
                  {palletTypes.map((pt) => (
                    <button key={pt.id} onClick={() => handleSelectPalletType(pt.id)} disabled={busy}
                      className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 active:bg-gray-100 disabled:opacity-50">
                      {pt.name} {pt.comment || ""}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal === "service" && (
              <>
                <h3 className="font-bold text-gray-900">Добавить услугу</h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {servicePrices.map((sp) => (
                    <button key={sp.id} onClick={() => { setSelectedService(sp); setInputValue("1"); setModal("serviceQty"); }}
                      className="w-full py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-left px-4 active:bg-gray-100">
                      <div className="font-medium text-gray-700">{sp.name}</div>
                      <div className="text-xs text-gray-400">{sp.price} ₽</div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal === "serviceQty" && selectedService && (
              <>
                <h3 className="font-bold text-gray-900">{selectedService.name}</h3>
                <p className="text-sm text-gray-500">Цена: {selectedService.price} ₽</p>
                <input type="number" inputMode="numeric" min="1" value={inputValue} onChange={(e) => setInputValue(e.target.value)} autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" placeholder="Количество" />
                <button onClick={handleAddService} disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Добавить</button>
              </>
            )}

            {modal === "confirm_warehouse" && (
              <>
                <h3 className="font-bold text-gray-900">Перевести на склад?</h3>
                <p className="text-sm text-gray-500">Заявка #{req.id} будет переведена в статус "На складе"</p>
                <div className="flex gap-2">
                  <button onClick={() => setModal(null)} className="flex-1 py-3 bg-gray-100 rounded-xl font-medium text-gray-700">Отмена</button>
                  <button onClick={handleToWarehouse} disabled={busy} className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium disabled:opacity-50">✅ Подтвердить</button>
                </div>
              </>
            )}

            {modal === "addBoxLine" && (
              <>
                <h3 className="font-bold text-gray-900">Выберите тип</h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {(req.packagingType === "pallets" ? palletTypes : boxTypes).map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setAddLineType({ id: t.id, name: t.name, kind: req.packagingType === "pallets" ? "pallet" : "box" }); setModal("addBoxLineQty"); }}
                      className="w-full py-3 px-4 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 text-left active:bg-gray-100"
                    >
                      {t.name}{"hint" in t && t.hint ? ` — ${t.hint}` : "comment" in t && (t as any).comment ? ` — ${(t as any).comment}` : ""}
                    </button>
                  ))}
                </div>
              </>
            )}

            {modal === "addBoxLineQty" && addLineType && (
              <>
                <h3 className="font-bold text-gray-900">{addLineType.name}</h3>
                <p className="text-sm text-gray-500">Укажите количество</p>
                <input
                  type="number" inputMode="numeric" min="1"
                  value={addLineQty}
                  onChange={(e) => setAddLineQty(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg"
                />
                <button onClick={handleAddBoxLine} disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Добавить строку</button>
              </>
            )}

            {modal === "comment" && (
              <>
                <h3 className="font-bold text-gray-900">Комментарий</h3>
                <textarea
                  autoFocus
                  value={commentValue}
                  onChange={(e) => setCommentValue(e.target.value)}
                  rows={4}
                  placeholder="Введите комментарий к заявке..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none outline-none focus:border-blue-400"
                />
                <button onClick={handleSaveComment} disabled={busy} className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Сохранить</button>
              </>
            )}

            {modal !== "confirm_warehouse" && (
              <button onClick={() => setModal(null)} className="w-full py-2 text-sm text-gray-400">Отмена</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
