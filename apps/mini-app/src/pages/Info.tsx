export default function Info() {
  const items = [
    { icon: "📍", title: "Склад", desc: "г. Белгород · приём ежедневно" },
    { icon: "💼", title: "Услуги", desc: "FBS / FBO · WB и OZON · упаковка · маркировка" },
    { icon: "🚚", title: "Рейсы", desc: "Регулярно, без переносов" },
    { icon: "⏰", title: "Режим", desc: "Пн–Пт: 9:00–18:00" },
  ];

  return (
    <div className="px-3 pt-3 pb-16 fade-in">
      <h1 className="text-lg font-bold text-tg-text mb-3">Информация</h1>

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

      <div className="bg-tg-secondary-bg rounded-xl px-3 py-2.5">
        <div className="text-sm font-semibold text-tg-text mb-1.5">📞 Контакты</div>
        <div className="flex flex-col gap-1 text-xs">
          <a href="tel:+74722000000" className="text-tg-link font-medium">+7 (4722) 00-00-00</a>
          <a href="mailto:info@ved31.ru" className="text-tg-link font-medium">info@ved31.ru</a>
        </div>
      </div>
    </div>
  );
}
