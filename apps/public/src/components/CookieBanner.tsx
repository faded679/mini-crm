import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export const COOKIE_KEY = "sologo_cookie_consent";
const METRIKA_ID = 110339734;

function loadMetrika() {
  const w = window as Window & { __sologoMetrika?: boolean; ym?: (...args: unknown[]) => void };
  if (w.__sologoMetrika) return;
  w.__sologoMetrika = true;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_ID}`;
  script.onload = () => {
    w.ym?.(METRIKA_ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      accurateTrackBounce: true,
      trackLinks: true,
    });
  };
  document.head.appendChild(script);
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const v = localStorage.getItem(COOKIE_KEY);
      if (v === "all") loadMetrika();
      if (!v) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function save(value: "all" | "necessary") {
    try {
      localStorage.setItem(COOKIE_KEY, value);
    } catch {
      /* ignore */
    }
    if (value === "all") loadMetrika();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] border-t border-nav-bg bg-card/95 px-4 py-3 shadow-[0_-8px_24px_rgba(39,56,74,0.12)] backdrop-blur">
      <div className="mx-auto flex max-w-[420px] flex-col gap-3">
        <p className="text-xs leading-relaxed text-muted">
          Используем cookie для входа и, с вашего согласия, Яндекс.Метрику.{" "}
          <Link to="/privacy" className="text-accent underline underline-offset-2">
            Политика конфиденциальности
          </Link>
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => save("necessary")}
            className="h-10 flex-1 rounded-2xl border border-nav-bg text-xs font-semibold text-heading"
          >
            Только нужные
          </button>
          <button
            type="button"
            onClick={() => save("all")}
            className="h-10 flex-1 rounded-2xl bg-accent text-xs font-semibold text-white"
          >
            Принять
          </button>
        </div>
      </div>
    </div>
  );
}
