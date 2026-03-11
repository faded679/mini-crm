export default function Info() {
  return (
    <div className="p-4 pb-24">
      <h1 className="text-xl font-bold text-tg-text mb-6">Информация</h1>

      <div className="space-y-4">
        <section className="bg-tg-secondary-bg rounded-xl p-4">
          <h2 className="text-base font-bold text-tg-text mb-2">📍 Наш склад</h2>
          <p className="text-sm text-tg-hint leading-relaxed">
            г. Белгород<br />
            Приём товара ежедневно
          </p>
        </section>

        <section className="bg-tg-secondary-bg rounded-xl p-4">
          <h2 className="text-base font-bold text-tg-text mb-2">💼 Услуги</h2>
          <ul className="text-sm text-tg-hint space-y-1.5 leading-relaxed">
            <li>• Приём и хранение товара на складе</li>
            <li>• Работа с <strong className="text-tg-text">FBS</strong> и <strong className="text-tg-text">FBO</strong></li>
            <li>• Доставка на склады <strong className="text-tg-text">Wildberries</strong> и <strong className="text-tg-text">OZON</strong></li>
            <li>• Паллетирование и упаковка</li>
            <li>• Маркировка товара</li>
          </ul>
        </section>

        <section className="bg-tg-secondary-bg rounded-xl p-4">
          <h2 className="text-base font-bold text-tg-text mb-2">🚚 Регулярные рейсы</h2>
          <p className="text-sm text-tg-hint leading-relaxed">
            Отправки выполняются регулярно, без переносов.<br />
            Точное расписание рейсов уточняйте у менеджера.
          </p>
        </section>

        <section className="bg-tg-secondary-bg rounded-xl p-4">
          <h2 className="text-base font-bold text-tg-text mb-2">📞 Контакты</h2>
          <div className="text-sm text-tg-hint space-y-1.5 leading-relaxed">
            <p>
              Телефон:{" "}
              <a href="tel:+74722000000" className="text-tg-link font-medium">
                +7 (4722) 00-00-00
              </a>
            </p>
            <p>
              Email:{" "}
              <a href="mailto:info@ved31.ru" className="text-tg-link font-medium">
                info@ved31.ru
              </a>
            </p>
          </div>
        </section>

        <section className="bg-tg-secondary-bg rounded-xl p-4">
          <h2 className="text-base font-bold text-tg-text mb-2">⏰ Режим работы</h2>
          <p className="text-sm text-tg-hint leading-relaxed">
            Пн — Пт: 9:00 — 18:00<br />
            Сб — Вс: выходной
          </p>
        </section>
      </div>
    </div>
  );
}
