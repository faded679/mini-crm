import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { path: "/", label: "Главная", icon: HomeIcon },
  { path: "/new", label: "Заявка", icon: PlusIcon },
  { path: "/history", label: "История", icon: HistoryIcon },
  { path: "/info", label: "Инфо", icon: InfoIcon },
];

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 transition-colors ${active ? "text-tg-button-text" : "text-tg-hint"}`}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 transition-colors ${active ? "text-tg-button-text" : "text-tg-hint"}`}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 transition-colors ${active ? "text-tg-button-text" : "text-tg-hint"}`}>
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function InfoIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 transition-colors ${active ? "text-tg-button-text" : "text-tg-hint"}`}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const isInputFocused = () => {
      const tag = document.activeElement?.tagName;
      return tag === "INPUT" || tag === "TEXTAREA";
    };

    const onFocusIn = () => { if (isInputFocused()) setHidden(true); };
    const onFocusOut = () => { setTimeout(() => { if (!isInputFocused()) setHidden(false); }, 120); };
    const onResize = () => { if (!isInputFocused()) setHidden(false); };

    document.addEventListener("focusin", onFocusIn, true);
    document.addEventListener("focusout", onFocusOut, true);
    window.addEventListener("resize", onResize);
    const vv = window.visualViewport;
    if (vv) vv.addEventListener("resize", onResize);

    return () => {
      document.removeEventListener("focusin", onFocusIn, true);
      document.removeEventListener("focusout", onFocusOut, true);
      window.removeEventListener("resize", onResize);
      if (vv) vv.removeEventListener("resize", onResize);
    };
  }, []);

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)] bg-tg-secondary-bg border-t" style={{ borderColor: "var(--tg-theme-hint-color, #ccc)" }}>
      <div className="flex">
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex-1 flex flex-col items-center justify-center py-2.5 transition-all active:opacity-70 ${
                active ? "bg-tg-button" : ""
              }`}
            >
              <Icon active={active} />
              <span className={`text-[10px] font-semibold mt-1 ${active ? "text-tg-button-text" : "text-tg-hint"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
