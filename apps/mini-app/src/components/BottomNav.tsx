import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { path: "/new", label: "Заявка", icon: PlusIcon },
  { path: "/history", label: "История", icon: HistoryIcon },
  { path: "/info", label: "Инфо", icon: InfoIcon },
];

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
    const vv = window.visualViewport;
    if (vv) {
      const onResize = () => {
        const keyboardOpen = vv.height < window.innerHeight * 0.75;
        setHidden(keyboardOpen);
      };
      vv.addEventListener("resize", onResize);
      return () => vv.removeEventListener("resize", onResize);
    }
    // fallback for browsers without visualViewport
    const onFocus = () => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") setHidden(true);
    };
    const onBlur = () => setTimeout(() => setHidden(false), 150);
    document.addEventListener("focusin", onFocus);
    document.addEventListener("focusout", onBlur);
    return () => {
      document.removeEventListener("focusin", onFocus);
      document.removeEventListener("focusout", onBlur);
    };
  }, []);

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-center items-end gap-8 px-4 pb-4 pt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path === "/new" && pathname === "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90`}
            >
              <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-md ${
                active
                  ? "bg-tg-button shadow-lg scale-105"
                  : "bg-tg-secondary-bg"
              }`}>
                <Icon active={active} />
              </div>
              <span className={`text-[11px] font-semibold transition-colors ${active ? "text-tg-button" : "text-tg-hint"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
