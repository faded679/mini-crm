import { Link } from "react-router-dom";

export default function PrivacyPage() {
  return (
    <div className="min-h-[100dvh] bg-bg px-4 py-8">
      <div className="mx-auto max-w-[420px]">
        <Link to="/" className="text-sm text-accent underline underline-offset-2">
          ← На главную
        </Link>
        <div className="mt-4 rounded-[22px] bg-card p-5 shadow-[0_10px_22px_rgba(39,56,74,0.1)]">
          <p className="m-0 text-xs text-muted">SOLOGO · 152-ФЗ</p>
          <h1 className="mt-1 text-[22px] font-bold leading-tight text-heading">
            Политика конфиденциальности
          </h1>
          <p className="mt-2 text-xs text-muted">Редакция от 19 августа 2026 г. Сайт sologo.ru</p>

          <div className="mt-6 space-y-5 text-sm leading-relaxed text-muted [&_h2]:mb-1.5 [&_h2]:text-[15px] [&_h2]:font-bold [&_h2]:text-heading [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5">
            <section>
              <h2>1. Общие положения</h2>
              <p>
                Политика описывает обработку персональных данных в сервисе доставки на маркетплейсы
                SOLOGO в соответствии с Федеральным законом от 27.07.2006 № 152-ФЗ.
              </p>
            </section>
            <section>
              <h2>2. Оператор</h2>
              <p>
                ИП Соловьёв Артём Александрович, ИНН 302201915296, 309167, Россия, Белгородская обл.,
                Краснояружский р-н, пос. Степное, ул. Садовая, д. 9/1.
              </p>
            </section>
            <section>
              <h2>3. Какие данные обрабатываются</h2>
              <ul>
                <li>номер телефона — для входа;</li>
                <li>фамилия, имя, email, ИНН организации — в профиле;</li>
                <li>данные заявок, заказов и операций;</li>
                <li>технические данные и cookie, в том числе Яндекс.Метрика — при согласии.</li>
              </ul>
            </section>
            <section>
              <h2>4. Цели и основания</h2>
              <p>
                Идентификация пользователя, оказание логистических услуг, связь по заявкам,
                уведомления о статусе. Основания: согласие субъекта (ст. 6, 9 152-ФЗ) и исполнение
                договора.
              </p>
            </section>
            <section>
              <h2>5. Cookie</h2>
              <p>
                Необходимые cookie хранят сессию входа. Аналитические cookie Яндекс.Метрики
                включаются только после «Принять» в баннере.
              </p>
            </section>
            <section>
              <h2>6. Передача</h2>
              <p>
                Данные не продаются. Могут передаваться подрядчикам для исполнения перевозки и в
                случаях, предусмотренных законодательством РФ.
              </p>
            </section>
            <section>
              <h2>7. Срок хранения</h2>
              <p>
                Пока действует аккаунт и в течение сроков, необходимых для исполнения договора и
                закона. Согласие можно отозвать.
              </p>
            </section>
            <section>
              <h2>8. Права</h2>
              <p>
                Вы вправе запросить уточнение, удаление данных или отозвать согласие, направив
                заявление оператору. После отзыва обработка прекращается в срок, установленный
                152-ФЗ, если закон не требует хранить данные дольше.
              </p>
            </section>
            <section>
              <h2>9. Трансграничная передача</h2>
              <p>
                Обработка ведётся на территории Российской Федерации. Аналитика Яндекс.Метрики
                подключается только при согласии «Принять».
              </p>
            </section>
            <section>
              <h2>10. Контакты оператора</h2>
              <p>
                По вопросам персональных данных:{" "}
                <a href="tel:+79586606096" className="text-accent underline underline-offset-2">
                  +7 (958) 660-60-96
                </a>
                , Telegram{" "}
                <a
                  href="https://t.me/SolovyovEx"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent underline underline-offset-2"
                >
                  @SolovyovEx
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
