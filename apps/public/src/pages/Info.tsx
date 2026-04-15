import { useState } from "react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function Info() {
  const [showVideo, setShowVideo] = useState(false);

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <h2 className="text-heading text-lg font-bold mb-2">Доставка на маркетплейсы</h2>
        <p className="text-sm text-heading leading-relaxed">
          Белгород → склады WB и OZON. FBS и FBO поставки, регулярные рейсы без переносов.
        </p>
      </section>

      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">📍</span>
          <h2 className="text-heading text-base font-bold">Местоположение склада</h2>
        </div>
        <div className="bg-bg rounded-xl p-3 mb-3">
          <p className="text-xs font-semibold text-heading mb-0.5">Адрес</p>
          <p className="text-xs text-muted leading-relaxed">г. Белгород, ул. Магистральная, 55к9</p>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <a
            href="https://2gis.ru/belgorod/inside/6474560119520659/firm/70000001062666018"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-11 bg-accent text-white rounded-xl text-xs font-semibold active:opacity-80 transition"
          >
            🗺 2ГИС
          </a>
          <a
            href="https://yandex.com/maps/4/belgorod/house/magistralnaya_ulitsa_55k9/Z08YcwRhQEEHQFtqfXl3dn9rbA==/?ll=36.532152%2C50.567469&z=18"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 h-11 bg-accent text-white rounded-xl text-xs font-semibold active:opacity-80 transition"
          >
            🗺 Яндекс
          </a>
        </div>
        <button
          onClick={() => setShowVideo(!showVideo)}
          className="w-full h-11 rounded-xl border border-accent text-accent text-xs font-semibold transition active:bg-accent active:text-white"
        >
          {showVideo ? "▲ Скрыть видео" : "▶ Как пройти к складу"}
        </button>
        {showVideo && (
          <div className="mt-3 rounded-xl overflow-hidden bg-black">
            <video controls className="w-full" src={`${API_URL}/assets/examples/videolocation.mp4`}>
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        )}
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
      </section>
    </div>
  );
}
