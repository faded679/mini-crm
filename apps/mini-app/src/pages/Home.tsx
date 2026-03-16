import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 pb-28 relative">
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-6">

          <h1 className="text-xl font-bold text-tg-text">Доставка на маркетплейсы</h1>
          <p className="text-xs text-tg-hint mt-1">Белгород → склады WB и OZON</p>
        </div>

        <div className="bg-tg-secondary-bg rounded-xl p-3 mb-5 space-y-2.5">
          {[
            { icon: "📦", text: "Приём товара на складе в Белгороде" },
            { icon: "📊", text: "Работаем с FBS и FBO" },
            { icon: "🚚", text: "Регулярные рейсы без переносов" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-tg-text leading-tight">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3 mb-6">
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-purple-500/70 text-white text-sm font-semibold">
            Wildberries
          </span>
          <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-500/70 text-white text-sm font-semibold">
            OZON
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate("/fbs")}
            className="py-3 rounded-xl bg-tg-button text-tg-button-text text-base font-semibold active:opacity-70 transition shadow-sm"
          >
            FBS
          </button>
          
          <button
            onClick={() => navigate("/new?type=fbo")}
            className="py-3 rounded-xl bg-tg-button text-tg-button-text text-base font-semibold active:opacity-70 transition shadow-sm"
          >
            FBO
          </button>
        </div>
      </div>
    </div>
  );
}
