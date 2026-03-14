import { useNavigate } from "react-router-dom";

export default function FbsRequest() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] px-4 py-6 pb-28">
      <div className="max-w-lg mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-tg-link text-sm mb-4"
          >
            <span>←</span>
            <span>Назад</span>
          </button>
          <h1 className="text-2xl font-bold text-tg-text">Заявка FBS</h1>
          <p className="text-sm text-tg-hint mt-2">
            Оформление заявки на доставку по схеме FBS (Fulfillment by Seller)
          </p>
        </div>

        <div className="bg-tg-secondary-bg rounded-xl p-4 mb-4">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="font-semibold text-tg-text mb-1">FBS - что это?</h3>
              <p className="text-sm text-tg-hint leading-relaxed">
                FBS (Fulfillment by Seller) — схема работы, при которой вы храните товар у себя 
                и отправляете его покупателю после продажи через маркетплейс.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-tg-secondary-bg rounded-xl p-4 mb-6">
          <h3 className="font-semibold text-tg-text mb-3">Преимущества FBS:</h3>
          <div className="space-y-2.5">
            {[
              { icon: "💰", text: "Экономия на хранении товара" },
              { icon: "🎯", text: "Полный контроль над остатками" },
              { icon: "⚡", text: "Быстрая отправка после продажи" },
              { icon: "📊", text: "Гибкое управление ассортиментом" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <span className="text-lg flex-shrink-0">{item.icon}</span>
                <p className="text-sm text-tg-text">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-2">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="text-sm text-gray-700 font-medium mb-1">В разработке</p>
              <p className="text-xs text-gray-600">
                Функционал оформления FBS заявок находится в разработке. 
                Скоро здесь появится форма для создания заявки.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => navigate("/")}
          className="w-full py-3.5 rounded-xl bg-tg-button text-tg-button-text text-base font-semibold active:scale-[0.97] transition-transform"
        >
          Вернуться на главную
        </button>
      </div>
    </div>
  );
}
