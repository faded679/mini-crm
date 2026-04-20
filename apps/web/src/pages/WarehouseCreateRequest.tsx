import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getWarehouseClients,
  getWarehouseCities,
  getWarehouseCitiesFbs,
  getWarehouseBoxTypes,
  getWarehousePalletTypes,
  getWarehouseRates,
  getWarehouseScheduleFbs,
  getWarehousePriceFbs,
  createWarehouseRequest,
  type WHClient,
  type WHCity,
  type WHBoxType,
  type WHPalletType,
  type WHRate,
  type WHScheduleFbs,
  type WHPriceFbs,
} from "../api";

type Step = "type" | "client" | "city" | "date" | "packaging" | "size" | "count" | "volume" | "confirm";

function getClientOrgName(c: WHClient): string {
  const cp = c.counterparties?.[0]?.counterparty;
  if (!cp) return `Клиент #${c.id}`;
  return cp.shortName || cp.name || `#${c.id}`;
}

export default function WarehouseCreateRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("type");
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState("");

  // Data
  const [clients, setClients] = useState<WHClient[]>([]);
  const [cities, setCities] = useState<WHCity[]>([]);
  const [citiesFbs, setCitiesFbs] = useState<WHCity[]>([]);
  const [boxTypes, setBoxTypes] = useState<WHBoxType[]>([]);
  const [palletTypes, setPalletTypes] = useState<WHPalletType[]>([]);
  const [rates, setRates] = useState<WHRate[]>([]);
  const [scheduleFbs, setScheduleFbs] = useState<WHScheduleFbs[]>([]);
  const [priceFbs, setPriceFbs] = useState<WHPriceFbs[]>([]);

  // Selections
  const [reqType, setReqType] = useState<"fbo" | "fbs">("fbo");
  const [selectedClient, setSelectedClient] = useState<WHClient | null>(null);
  const [selectedCity, setSelectedCity] = useState<WHCity | null>(null);
  const [deliveryDate, setDeliveryDate] = useState("");
  const [packagingType, setPackagingType] = useState<"boxes" | "pallets">("boxes");
  const [selectedSize, setSelectedSize] = useState<WHBoxType | WHPalletType | null>(null);
  const [boxCount, setBoxCount] = useState("1");
  const [volume, setVolume] = useState("");

  useEffect(() => {
    getWarehouseClients().then(setClients).catch(() => {});
    getWarehouseCities().then(setCities).catch(() => {});
    getWarehouseCitiesFbs().then(setCitiesFbs).catch(() => {});
    getWarehouseBoxTypes().then(setBoxTypes).catch(() => {});
    getWarehousePalletTypes().then(setPalletTypes).catch(() => {});
    getWarehouseRates().then(setRates).catch(() => {});
    getWarehouseScheduleFbs().then(setScheduleFbs).catch(() => {});
    getWarehousePriceFbs().then(setPriceFbs).catch(() => {});
  }, []);

  const filteredClients = clients.filter((c) => {
    const name = getClientOrgName(c).toLowerCase();
    return name.includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    if (!selectedClient || !selectedCity) return;
    setBusy(true);
    try {
      const isFbs = reqType === "fbs";
      const deliveryTypeId = isFbs ? 1 : 2;

      // Calculate price
      let items: any[] = [];
      if (isFbs) {
        const vol = parseFloat(volume);
        const cityPrices = priceFbs.filter((p) => p.destination === selectedCity.shortName);
        const selected = cityPrices.find((p) => {
          const pv = parseFloat(p.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          return vol <= pv;
        }) || cityPrices[cityPrices.length - 1];
        if (selected) {
          const priceNum = parseFloat(selected.price.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
          const volNum = parseFloat(selected.volume.replace(/[^\d.,]/g, "").replace(",", ".")) || 1;
          const perM3 = priceNum / volNum;
          const desc = (selectedCity as any).cityFullName || selectedCity.fullName || selectedCity.shortName;
          items = [{ description: desc, unit: "м³", quantity: vol, price: perM3, amount: Math.round(perM3 * vol * 100) / 100 }];
        }
      } else {
        const cnt = parseInt(boxCount, 10) || 1;
        const rate = rates.find((r) =>
          r.cityId === selectedCity.id &&
          r.unit === (packagingType === "boxes" ? "boxes" : "pallet") &&
          (packagingType === "boxes" ? r.boxTypeId === (selectedSize as WHBoxType)?.id : r.palletTypeId === (selectedSize as WHPalletType)?.id)
        );
        if (rate) {
          const desc = selectedCity.fullName || selectedCity.shortName;
          items = [{ description: desc, unit: packagingType === "pallets" ? "палета" : "место", quantity: cnt, price: rate.price, amount: rate.price * cnt }];
        }
      }

      const payload: any = {
        clientId: selectedClient.id,
        cityId: selectedCity.id,
        deliveryDate,
        deliveryTypeId,
        packagingType: isFbs ? "boxes" : packagingType,
        boxCount: isFbs ? 1 : parseInt(boxCount, 10) || 1,
        volume: isFbs ? parseFloat(volume) : null,
        items,
      };
      if (!isFbs && packagingType === "boxes" && selectedSize) payload.boxTypeId = selectedSize.id;
      if (!isFbs && packagingType === "pallets" && selectedSize) payload.palletTypeId = selectedSize.id;

      const result = await createWarehouseRequest(payload);
      alert(`✅ Заявка #${result.id} создана!`);
      navigate("/warehouse/new");
    } catch (e: any) { alert(e.message); }
    setBusy(false);
  };

  const stepTitle: Record<Step, string> = {
    type: "Тип доставки",
    client: "Организация",
    city: "Направление",
    date: "Дата доставки",
    packaging: "Тип упаковки",
    size: "Размер",
    count: "Количество",
    volume: "Объём",
    confirm: "Подтверждение",
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => step === "type" ? navigate("/warehouse") : goBack()} className="text-2xl leading-none">←</button>
        <h1 className="font-bold text-gray-900">Создать заявку</h1>
        <span className="ml-auto text-xs text-gray-400">{stepTitle[step]}</span>
      </div>

      <div className="flex-1 px-4 pt-4 pb-4 space-y-3">
        {step === "type" && (
          <div className="space-y-3">
            <button onClick={() => { setReqType("fbo"); setStep("client"); }} className="w-full bg-white border border-gray-200 rounded-xl py-5 text-base font-medium text-gray-700 active:bg-gray-50">📦 FBO</button>
            <button onClick={() => { setReqType("fbs"); setStep("client"); }} className="w-full bg-white border border-gray-200 rounded-xl py-5 text-base font-medium text-gray-700 active:bg-gray-50">🚚 FBS</button>
          </div>
        )}

        {step === "client" && (
          <div className="space-y-3">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск организации..." autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm" />
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {filteredClients.map((c) => (
                <button key={c.id} onClick={() => { setSelectedClient(c); setStep("city"); }}
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 text-left active:bg-gray-50">
                  {getClientOrgName(c)}
                </button>
              ))}
              {filteredClients.length === 0 && <div className="text-center text-gray-400 py-4 text-sm">Не найдено</div>}
            </div>
          </div>
        )}

        {step === "city" && (
          <div className="space-y-2 max-h-[70vh] overflow-y-auto">
            {(reqType === "fbs" ? citiesFbs : cities).map((c) => (
              <button key={c.id} onClick={() => { setSelectedCity(c); setStep(reqType === "fbs" ? "date" : "date"); }}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 text-left active:bg-gray-50">
                {c.shortName}
              </button>
            ))}
          </div>
        )}

        {step === "date" && (
          <div className="space-y-3">
            {reqType === "fbs" && selectedCity ? (() => {
              const fbsDates = scheduleFbs.filter((s) => s.cityId === selectedCity.id);
              if (fbsDates.length === 0) {
                return (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-500">Нет расписания для {selectedCity.shortName}. Выберите дату вручную:</p>
                    <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
                    <button onClick={() => { if (deliveryDate) setStep("volume"); }} disabled={!deliveryDate}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Далее</button>
                  </div>
                );
              }
              return (
                <>
                  <p className="text-sm text-gray-500">Доступные даты для {selectedCity.shortName}:</p>
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {fbsDates.map((s) => (
                      <button key={s.id} onClick={() => { setDeliveryDate(s.deliveryDate.split("T")[0]); setStep("volume"); }}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 text-left active:bg-gray-50">
                        {new Date(s.deliveryDate).toLocaleDateString("ru-RU")}
                      </button>
                    ))}
                  </div>
                </>
              );
            })() : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Выберите дату доставки:</p>
                <input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
                <button onClick={() => { if (deliveryDate) setStep("packaging"); }} disabled={!deliveryDate}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Далее</button>
              </div>
            )}
          </div>
        )}

        {step === "packaging" && (
          <div className="space-y-3">
            <button onClick={() => { setPackagingType("boxes"); setStep("size"); }} className="w-full bg-white border border-gray-200 rounded-xl py-5 text-base font-medium text-gray-700 active:bg-gray-50">📦 Коробки</button>
            <button onClick={() => { setPackagingType("pallets"); setStep("size"); }} className="w-full bg-white border border-gray-200 rounded-xl py-5 text-base font-medium text-gray-700 active:bg-gray-50">🪵 Палеты</button>
          </div>
        )}

        {step === "size" && (
          <div className="space-y-2">
            {(packagingType === "boxes" ? boxTypes : palletTypes).map((t) => (
              <button key={t.id} onClick={() => { setSelectedSize(t); setStep("count"); }}
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 text-left active:bg-gray-50">
                {t.name} {("hint" in t ? t.hint : ("comment" in t ? t.comment : "")) || ""}
              </button>
            ))}
          </div>
        )}

        {step === "count" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Количество мест:</p>
            <input type="number" inputMode="numeric" min="1" value={boxCount} onChange={(e) => setBoxCount(e.target.value)} autoFocus
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
            <button onClick={() => { if (parseInt(boxCount, 10) > 0) setStep("confirm"); }} disabled={!parseInt(boxCount, 10)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Далее</button>
          </div>
        )}

        {step === "volume" && (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">Объём товара (м³):</p>
            <input type="text" inputMode="decimal" value={volume} onChange={(e) => setVolume(e.target.value.replace(",", "."))} autoFocus placeholder="2.5"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg" />
            <button onClick={() => { if (parseFloat(volume) > 0) setStep("confirm"); }} disabled={!parseFloat(volume)}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium disabled:opacity-50">Далее</button>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-3">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-2">
              <div className="flex justify-between text-sm"><span className="text-gray-400">Тип</span><span className="font-medium">{reqType.toUpperCase()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Организация</span><span className="font-medium">{selectedClient ? getClientOrgName(selectedClient) : "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Направление</span><span className="font-medium">{selectedCity?.shortName || "—"}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">Дата</span><span className="font-medium">{deliveryDate ? new Date(deliveryDate).toLocaleDateString("ru-RU") : "—"}</span></div>
              {reqType === "fbs" ? (
                <div className="flex justify-between text-sm"><span className="text-gray-400">Объём</span><span className="font-medium">{volume} м³</span></div>
              ) : (
                <>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Упаковка</span><span className="font-medium">{packagingType === "pallets" ? "Палеты" : "Коробки"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Размер</span><span className="font-medium">{selectedSize?.name || "—"}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-400">Количество</span><span className="font-medium">{boxCount}</span></div>
                </>
              )}
            </div>
            <button onClick={handleCreate} disabled={busy}
              className="w-full bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-xl py-4 text-base font-semibold transition shadow-sm disabled:opacity-50">
              {busy ? "Создание..." : "✅ Создать заявку"}
            </button>
          </div>
        )}
      </div>
    </div>
  );

  function goBack() {
    const flow_fbo: Step[] = ["type", "client", "city", "date", "packaging", "size", "count", "confirm"];
    const flow_fbs: Step[] = ["type", "client", "city", "date", "volume", "confirm"];
    const flow = reqType === "fbs" ? flow_fbs : flow_fbo;
    const idx = flow.indexOf(step);
    if (idx > 0) setStep(flow[idx - 1]);
  }
}
