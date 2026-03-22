import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-[42px] h-[42px] rounded-xl bg-accent text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
            СЭ
          </div>
          <div>
            <p className="text-muted text-xs m-0">Логистический сервис</p>
            <h1 className="text-heading text-[21px] font-bold m-0">Соловьев-Экспресс</h1>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-[22px] shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 overflow-hidden">
        <div className="relative rounded-[20px] overflow-hidden border border-gray-200">
          <img
            src={`${import.meta.env.VITE_API_URL}/assets/examples/logistics-app/hero-main.jpg`}
            alt="Маршрут доставки"
            className="w-full block"
          />
          {/* Кнопка FBS в точке A (верхняя часть маршрута) */}
          <button
            onClick={() => navigate("/fbs")}
            className="absolute top-[39%] left-[50%] -translate-x-1/2 rounded-[14px] w-40 h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBS
          </button>
          {/* Кнопка FBO в точке B (нижняя часть маршрута) */}
          <button
            onClick={() => navigate("/fbo")}
            className="absolute bottom-[39%] left-[50%] -translate-x-1/2 rounded-[14px] w-40 h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBO
          </button>
        </div>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <h2 className="text-heading text-lg font-bold mb-2">Доставка на маркетплейсы</h2>
        <p className="text-sm text-heading leading-relaxed">
          Белгород → склады WB и OZON. FBS и FBO поставки, регулярные рейсы без переносов.
        </p>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <h2 className="text-heading text-base font-bold mb-2">О нас</h2>
        <div className="space-y-2">
          {[
            { icon: "📦", text: "Приём товара на складе в Белгороде" },
            { icon: "📊", text: "Работаем с FBS и FBO" },
            { icon: "🚚", text: "Регулярные рейсы без переносов" },
            { icon: "⏰", text: "Пн–Пт: 9:00–18:00" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="text-lg flex-shrink-0">{item.icon}</span>
              <p className="text-sm text-heading leading-tight m-0">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
        <h2 className="text-heading text-base font-bold mb-2">📞 Контакты</h2>
        <div className="flex flex-col gap-2 text-sm">
          <a href="tel:+79586606096" className="text-accent font-medium">+7 (958) 660-60-96</a>
          <a href="https://t.me/SolovyovEx" target="_blank" rel="noopener noreferrer" className="text-accent font-medium">@SolovyovEx (Telegram)</a>
        </div>
        <p className="text-xs text-muted mt-2">📍 г. Белгород, ул. Магистральная, 55к9</p>
      </section>
    </div>
  );
}
