import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-6 pb-20">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold text-center text-tg-text mb-8">
          Как мы работаем:
        </h1>

        <div className="space-y-5 mb-10">
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📦</span>
            <p className="text-base text-tg-text leading-snug">
              Приём товара на складе<br />в Белгороде.
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">📊</span>
            <p className="text-base text-tg-text leading-snug">
              Работаем с <strong>FBS</strong> и <strong>FBO</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl flex-shrink-0">🛒</span>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-purple-600 text-white text-sm font-semibold">
                Wildberries
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-600 text-white text-sm font-semibold">
                OZON
              </span>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">🚚</span>
            <p className="text-base text-tg-text leading-snug">
              Регулярные рейсы<br />без переносов
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate("/new")}
          className="w-full py-4 rounded-2xl bg-tg-button text-tg-button-text text-lg font-semibold shadow-lg active:scale-[0.98] transition-transform"
        >
          Оставить заявку
        </button>
      </div>
    </div>
  );
}
