import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { getToken, getSelectedOrgId } from "../auth";
import { getCompanyInfo, createFeedback, type MeResponse, type CompanyInfoItem } from "../api";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface Props {
  me?: MeResponse | null;
}

export default function Home({ me: meProp = null }: Props) {
  const navigate = useNavigate();
  const token = getToken();
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackStatus, setFeedbackStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const feedbackRef = useRef<HTMLElement>(null);

  const me = meProp;
  const selectedOrgId = getSelectedOrgId();
  const selectedOrg = me?.organizations?.find((o) => o.id === selectedOrgId) || null;

  const scrollToFeedback = () => {
    feedbackRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    let cancelled = false;
    getCompanyInfo()
      .then((infoData) => {
        if (!cancelled) setCompanyInfo(infoData);
      })
      .catch((err) => console.error("Home load error:", err))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const isBlocked = me?.isBlocked === true;
  const news = companyInfo.filter((i) => i.type === "news");
  const info = companyInfo.filter((i) => i.type === "info");

  async function handleFeedbackSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !feedbackMessage.trim()) return;
    setFeedbackStatus("sending");
    try {
      await createFeedback(
        {
          message: feedbackMessage,
          ...(selectedOrgId != null ? { counterpartyId: selectedOrgId } : {}),
        },
        token
      );
      setFeedbackStatus("success");
      setFeedbackMessage("");
    } catch {
      setFeedbackStatus("error");
    }
  }

  const clientDisplayName = me
    ? [me.lastName, me.firstName].filter(Boolean).join(" ").trim() || "Клиент"
    : null;
  const clientOrg = selectedOrg?.name || me?.organization;

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
        {(clientDisplayName || clientOrg) && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            {clientDisplayName && (
              <p className="text-sm text-heading m-0 font-medium">{clientDisplayName}</p>
            )}
            {clientOrg && (
              <p className="text-xs text-muted m-0 mt-0.5">Кабинет: {clientOrg}</p>
            )}
          </div>
        )}
      </section>

      <section className="bg-card rounded-[22px] shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3 overflow-hidden">
        <div className="p-6 flex flex-col gap-3">
          <button
            onClick={() => navigate("/fbs")}
            disabled={isBlocked}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 4px 12px rgba(216, 75, 85, 0.4)" }}
          >
            {isBlocked ? "Создание заявок заблокировано" : "Оставить заявку на FBS"}
          </button>
          <button
            onClick={() => navigate("/fbo")}
            disabled={isBlocked}
            className="w-full rounded-[14px] h-12 bg-accent text-white font-bold text-xs shadow-lg active:bg-accent-dark transition flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ boxShadow: "0 4px 12px rgba(216, 75, 85, 0.4)" }}
          >
            {isBlocked ? "Создание заявок заблокировано" : "Оставить заявку на FBO"}
          </button>
          <button
            onClick={scrollToFeedback}
            className="w-full rounded-[14px] h-12 bg-white text-accent font-bold text-xs border border-accent/40 shadow-sm active:opacity-80 transition flex items-center justify-center hover:bg-gray-50"
          >
            Предложить улучшение ✨
          </button>
        </div>
      </section>

      {isBlocked && (
        <section className="bg-red-50 border border-red-200 rounded-[22px] p-4 mb-3">
          <p className="text-sm text-red-700 font-medium">
            💬 У вас есть неоплаченный счёт старше 10 дней. Чтобы мы могли принять новую заявку, сначала нужно закрыть предыдущий рейс — так мы можем возить без предоплаты и дальше.
            Как только оплата пройдёт — всё сразу откроется.
            Если нужна копия счёта, просто напишите 🤝
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

      <section ref={feedbackRef} className="bg-card rounded-[22px] p-4 shadow-[0_10px_22px_rgba(39,56,74,0.1)] mb-3">
        <p className="text-muted text-xs mb-2">Ваши пожелания и проблемы</p>
        {!token ? (
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-800">
            Войдите, чтобы отправить сообщение.
          </div>
        ) : feedbackStatus === "success" ? (
          <div className="bg-green-50 rounded-xl p-3 text-sm text-green-800">
            Спасибо! Мы получили ваше сообщение и скоро разберёмся.
          </div>
        ) : (
          <form onSubmit={handleFeedbackSubmit} className="flex flex-col gap-3">
            <textarea
              value={feedbackMessage}
              onChange={(e) => setFeedbackMessage(e.target.value)}
              rows={3}
              placeholder="Опишите пожелание или проблему..."
              className="w-full px-3 py-2.5 rounded-2xl bg-bg border border-gray-200 outline-none text-heading text-sm resize-none focus:border-accent"
            />
            {feedbackStatus === "error" && (
              <p className="text-xs text-red-500">Не удалось отправить. Попробуйте позже.</p>
            )}
            <button
              type="submit"
              disabled={!feedbackMessage.trim() || feedbackStatus === "sending"}
              className="w-full h-11 rounded-2xl bg-accent text-white text-sm font-bold disabled:opacity-50"
            >
              {feedbackStatus === "sending" ? "Отправка..." : "Отправить"}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
