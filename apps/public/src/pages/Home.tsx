import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getToken } from "../auth";
import { getMe, getCompanyInfo, type MeResponse, type CompanyInfoItem } from "../api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function Home() {
  const navigate = useNavigate();
  const token = getToken();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [meData, infoData] = await Promise.all([
          token ? getMe(token) : Promise.resolve(null),
          getCompanyInfo(),
        ]);
        if (!cancelled) {
          setMe(meData);
          setCompanyInfo(infoData);
        }
      } catch (err) {
        console.error("Home load error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [token]);

  const isBlocked = me?.isBlocked === true;
  const news = companyInfo.filter((i) => i.type === "news");
  const info = companyInfo.filter((i) => i.type === "info");

  return (
    <div className="fade-in">
      <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <div className="flex items-center gap-2.5">
          <img src="/logotip.jpg" alt="Логотип" className="w-[42px] h-[42px] rounded-xl object-contain flex-shrink-0" />
          <div>
            <p className="text-muted text-xs m-0">Логистический сервис</p>
            <h1 className="text-heading text-[19px] font-bold m-0">Доставка на маркетплейсы</h1>
          </div>
        </div>
      </section>

      <section className="bg-card rounded-[22px] shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 overflow-hidden">
        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={() => navigate("/fbs")}
            disabled={isBlocked}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            {isBlocked ? "Создание заявок заблокировано" : "Оставить заявку на FBS"}
          </button>
          <button
            onClick={() => navigate("/fbo")}
            disabled={isBlocked}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: '0 4px 12px rgba(216, 75, 85, 0.4)' }}
          >
            {isBlocked ? "Создание заявок заблокировано" : "Оставить заявку на FBO"}
          </button>
        </div>
      </section>

      {isBlocked && (
        <section className="bg-red-50 border border-red-200 rounded-[22px] p-4 mb-3">
          <p className="text-sm text-red-700 font-medium">
            Согласно правилам нашего сервиса, ваш аккаунт заблокирован для создания новых заявок. Подробная информация была отправлена на вашу почту и телеграм.
          </p>
        </section>
      )}

      {!loading && info.length > 0 && (
        <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
          <p className="text-muted text-xs mb-2">Важная информация</p>
          <div className="space-y-3">
            {info.map((item) => (
              <div key={item.id} className="bg-amber-50 rounded-xl p-3">
                <p className="text-sm font-semibold text-amber-900 mb-1">{item.title}</p>
                <p className="text-sm text-amber-800 whitespace-pre-line">{item.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && news.length > 0 && (
        <section className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
          <p className="text-muted text-xs mb-2">Новости компании</p>
          <div className="space-y-3">
            {news.map((item) => (
              <div key={item.id} className="bg-blue-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-blue-900">{item.title}</p>
                  <span className="text-xs text-blue-700">{fmtDate(item.createdAt)}</span>
                </div>
                <p className="text-sm text-blue-800 whitespace-pre-line">{item.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
