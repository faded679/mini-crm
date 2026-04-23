import { useNavigate } from "react-router-dom";

const FEATURES = [
  {
    icon: "🚚",
    title: "FBS — со своего склада",
    desc: "Вы храните товар у себя, мы забираем заказы и доставляем на сортировочный центр маркетплейса.",
  },
  {
    icon: "🏭",
    title: "FBO — на склад маркетплейса",
    desc: "Отправляем партию товара напрямую на склад Wildberries или Ozon — быстрая обработка заказов.",
  },
  {
    icon: "📦",
    title: "Упаковка и маркировка",
    desc: "Коробки, палеты, стрейч, этикетки — всё включено. Принимаем грузы любых размеров.",
  },
  {
    icon: "📍",
    title: "Отслеживание заявки",
    desc: "Статус вашей заявки всегда доступен в личном кабинете — от приёмки до передачи в МП.",
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2.5">
          <img src="/logotip.jpg" alt="Логотип" className="w-[42px] h-[42px] rounded-xl object-contain flex-shrink-0" />
          <div>
            <p className="text-muted text-xs m-0">Логистический сервис</p>
            <h1 className="text-heading text-[21px] font-bold m-0">Доставка на маркетплейсы</h1>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-[22px] shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 overflow-hidden">
        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={() => navigate("/fbs")}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBS
          </button>
          <button
            onClick={() => navigate("/fbo")}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            Оставить заявку на FBO
          </button>
        </div>
      </section>

      {/* Info block */}
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-3">Как это работает</p>
        <div className="flex flex-col gap-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-start gap-3">
              <span className="text-2xl leading-none flex-shrink-0 mt-0.5">{f.icon}</span>
              <div>
                <p className="text-sm font-semibold text-heading mb-0.5">{f.title}</p>
                <p className="text-xs text-muted leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Contact block */}
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-xs text-muted uppercase font-semibold tracking-wide mb-3">Контакты</p>
        <div className="flex flex-col gap-2">
          <a href="tel:+78001234567" className="flex items-center gap-2 text-sm text-heading font-medium active:opacity-70">
            <span className="text-lg">📞</span> 8 (800) 123-45-67
          </a>
          <a href="mailto:info@sologo.ru" className="flex items-center gap-2 text-sm text-heading font-medium active:opacity-70">
            <span className="text-lg">✉️</span> info@sologo.ru
          </a>
          <a href="https://t.me/sologo_logistics" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-accent font-medium active:opacity-70">
            <span className="text-lg">💬</span> Telegram-канал
          </a>
        </div>
      </section>
    </div>
  );
}
