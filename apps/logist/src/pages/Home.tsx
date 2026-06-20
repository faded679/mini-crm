import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCities, type CitiesResponse, type CityEntry } from "../api";
import { MapPin, Calendar, ChevronRight, Truck, Package, List } from "lucide-react";

export default function Home() {
  const navigate = useNavigate();
  const [cities, setCities] = useState<CitiesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [deliveryType, setDeliveryType] = useState<"fbo" | "fbs">("fbo");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });

  useEffect(() => {
    getCities()
      .then(setCities)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cityList: CityEntry[] =
    cities
      ? deliveryType === "fbo"
        ? cities.fbo
        : cities.fbs
      : [];

  const canProceed = !!selectedCity && !!selectedDate;

  const handleProceed = () => {
    if (!canProceed) return;
    navigate(
      `/requests?city=${encodeURIComponent(selectedCity)}&date=${selectedDate}&type=${deliveryType}`
    );
  };

  return (
    <div className="min-h-dvh bg-slate-100 pb-8">
      <div className="bg-blue-600 px-4 pt-12 pb-6">
        <div className="flex items-center gap-3 mb-1">
          <Truck size={24} className="text-white" />
          <h1 className="text-xl font-bold text-white">Кабинет логиста</h1>
        </div>
        <p className="text-blue-200 text-sm">Выберите направление и дату</p>
      </div>

      <div className="px-4 -mt-2 space-y-4 pt-4">
        {/* Тип доставки */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Тип доставки</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { setDeliveryType("fbo"); setSelectedCity(""); }}
              className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                deliveryType === "fbo"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Package size={16} className="inline mr-1.5 mb-0.5" />
              FBO
            </button>
            <button
              onClick={() => { setDeliveryType("fbs"); setSelectedCity(""); }}
              className={`py-3 rounded-xl font-semibold text-sm transition-colors ${
                deliveryType === "fbs"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              <Truck size={16} className="inline mr-1.5 mb-0.5" />
              FBS
            </button>
          </div>
        </div>

        {/* Направление */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
            <MapPin size={14} /> Направление
          </p>
          {loading ? (
            <div className="text-center py-4 text-gray-400 text-sm">Загрузка...</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {cityList.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCity(c.shortName)}
                  className={`py-2.5 px-3 rounded-xl text-sm font-medium text-left transition-colors ${
                    selectedCity === c.shortName
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 active:bg-gray-200"
                  }`}
                >
                  {c.shortName}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Дата */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-3 flex items-center gap-1.5">
            <Calendar size={14} /> Дата доставки
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        {/* Кнопка */}
        <button
          onClick={handleProceed}
          disabled={!canProceed}
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base disabled:opacity-40 active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Посмотреть заявки
          <ChevronRight size={20} />
        </button>

        {/* История */}
        <button
          onClick={() => navigate("/history")}
          className="w-full bg-white text-gray-700 py-3.5 rounded-2xl font-medium text-sm active:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
        >
          <List size={16} />
          История рейсов
        </button>
      </div>
    </div>
  );
}
