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
