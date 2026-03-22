export default function Info() {
  return (
    <div className="fade-in">
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
