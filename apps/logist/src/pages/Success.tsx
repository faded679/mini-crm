import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCarriers, type CarrierRecord } from "../api";
import { CheckCircle, Home, List } from "lucide-react";

export default function Success() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<CarrierRecord | null>(null);

  useEffect(() => {
    getCarriers()
      .then((records) => {
        const found = records.find((r) => r.id === Number(id));
        if (found) setRecord(found);
      })
      .catch(() => {});
  }, [id]);

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="min-h-dvh bg-slate-100 flex flex-col items-center justify-center px-4 pb-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle size={48} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Готово!</h1>
          <p className="text-gray-500 mt-1">Перевозчик успешно привязан к заявкам</p>
        </div>

        {record && (
          <div className="bg-white rounded-2xl shadow-sm p-5 mb-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Направление</span>
              <span className="font-medium text-gray-900">{record.city} · {record.deliveryType.toUpperCase()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Дата доставки</span>
              <span className="font-medium text-gray-900">{formatDate(record.deliveryDate)}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Марка / номер</span>
              <span className="font-medium text-gray-900">{record.carBrand} · {record.carNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Водитель</span>
              <span className="font-medium text-gray-900">{record.driverName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Телефон</span>
              <span className="font-medium text-gray-900">{record.driverPhone}</span>
            </div>
            <div className="h-px bg-gray-100" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Привязано заявок</span>
              <span className="font-bold text-blue-600">{record.requests.length}</span>
            </div>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={() => navigate("/")}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-base active:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Home size={18} />
            На главную
          </button>
          <button
            onClick={() => navigate("/history")}
            className="w-full bg-white text-gray-700 py-3.5 rounded-2xl font-medium text-sm active:bg-gray-50 transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <List size={16} />
            История рейсов
          </button>
        </div>
      </div>
    </div>
  );
}
