import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4 pb-28 relative">
      <img src="/logo.jpg" alt="Logo" className="absolute top-4 left-4 h-16 w-auto object-contain" />
      <div className="w-full max-w-sm fade-in">
        <div className="text-center mb-6">

          <h1 className="text-xl font-bold text-tg-text">Доставка на маркетплейсы</h1>
          <p className="text-xs text-tg-hint mt-1">Белгород → склады WB и OZON</p>
        </div>

        <div className="bg-tg-secondary-bg rounded-xl p-3 mb-5 space-y-2.5" style={{ borderLeft: "3px solid #dc2626" }}>
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
          <span className="inline-flex items-center px-5 py-2 rounded-full bg-purple-600 text-white text-base font-bold">
            Wildberries
          </span>
          <span className="inline-flex items-center px-5 py-2 rounded-full bg-blue-600 text-white text-base font-bold">
            OZON
          </span>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => navigate("/new")}
            className="w-full py-3.5 rounded-xl bg-tg-button text-tg-button-text text-base font-semibold active:scale-[0.97] transition-transform"
          >
            Оставить заявку
          </button>
          
          <button
            onClick={() => navigate("/fbs")}
            className="w-full py-3.5 rounded-xl bg-tg-button text-tg-button-text text-base font-semibold active:scale-[0.97] transition-transform"
          >
            FBS
          </button>
        </div>
      </div>
    </div>
  );
}
