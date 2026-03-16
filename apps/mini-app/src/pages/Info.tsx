import { useState } from "react";
import { MapPin, Navigation, Play } from "lucide-react";

export default function Info() {
  const [showVideo, setShowVideo] = useState(false);

  const items = [
    { icon: "💼", title: "Услуги", desc: "FBS / FBO · WB и OZON · упаковка · маркировка" },
    { icon: "🚚", title: "Рейсы", desc: "Регулярно, без переносов" },
    { icon: "⏰", title: "Режим", desc: "Пн–Пт: 9:00–18:00" },
  ];

  return (
    <div className="px-3 pt-3 pb-28 fade-in">
      <h1 className="text-lg font-bold text-tg-text mb-3">Информация</h1>

      {/* Warehouse Location */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-4 mb-4 border border-blue-500/20">
        <div className="flex items-center gap-2 mb-3">
          <MapPin className="text-blue-500" size={20} />
          <h2 className="text-base font-bold text-tg-text">Местоположение склада</h2>
        </div>
        
        <div className="bg-tg-secondary-bg/50 rounded-xl p-3 mb-3">
          <div className="text-sm font-semibold text-tg-text mb-1">📍 Адрес</div>
          <div className="text-xs text-tg-hint leading-relaxed">
            г. Белгород, ул. Магистральная, 55к9
          </div>
        </div>

        {/* Maps Links */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <a
            href="https://2gis.ru/belgorod/inside/6474560119520659/firm/70000001062666018"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-tg-button text-tg-button-text rounded-xl py-3 px-3 font-medium text-sm active:opacity-70 transition"
          >
            <Navigation size={16} />
            2ГИС
          </a>
          <a
            href="https://yandex.com/maps/4/belgorod/house/magistralnaya_ulitsa_55k9/Z08YcwRhQEEHQFtqfXl3dn9rbA==/?ll=36.532152%2C50.567469&z=18"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-tg-button text-tg-button-text rounded-xl py-3 px-3 font-medium text-sm active:opacity-70 transition"
          >
            <Navigation size={16} />
            Яндекс Карты
          </a>
        </div>

        {/* Video Guide */}
        <button
          onClick={() => setShowVideo(!showVideo)}
          className="w-full flex items-center justify-center gap-2 bg-tg-button text-tg-button-text rounded-xl py-3 px-4 font-semibold text-sm active:opacity-70 transition"
        >
          <Play size={16} />
          {showVideo ? "Скрыть видео-инструкцию" : "Как пройти к складу"}
        </button>

        {showVideo && (
          <div className="mt-3 rounded-xl overflow-hidden bg-black">
            <video
              controls
              className="w-full"
              src={`${import.meta.env.VITE_API_URL}/assets/examples/videolocation.mp4`}
            >
              Ваш браузер не поддерживает видео.
            </video>
          </div>
        )}
      </div>

      {/* Services */}
      <div className="space-y-2 mb-4">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2.5 bg-tg-secondary-bg rounded-xl px-3 py-2.5">
            <span className="text-lg flex-shrink-0 mt-0.5">{item.icon}</span>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-tg-text">{item.title}</div>
              <div className="text-xs text-tg-hint leading-snug">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Contacts */}
      <div className="bg-tg-secondary-bg rounded-xl px-3 py-2.5">
        <div className="text-sm font-semibold text-tg-text mb-1.5">📞 Контакты</div>
        <div className="flex flex-col gap-3 text-xs">
          <a href="tel:+79092048554" className="text-tg-link font-medium"> +7 (909) 204-85-54</a> 
          <a href="https://t.me/SolovyovEx" target="_blank" rel="noopener noreferrer" className="text-tg-link font-medium"> @SolovyovEx (Telegram)</a>
        </div>
      </div>
    </div>
  );
}
