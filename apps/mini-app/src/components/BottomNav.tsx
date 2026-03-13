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
      className={`w-5 h-5 transition-colors ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-5 h-5 transition-colors ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <path d="M12 8v4l3 3" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}

function InfoIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-5 h-5 transition-colors ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </svg>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{ backgroundColor: "var(--tg-theme-bg-color, #ffffff)", borderTop: "1px solid var(--tg-theme-secondary-bg-color, #e5e5e5)" }}>
      <div className="flex justify-around items-center h-12 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path === "/new" && pathname === "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-[2px] px-5 py-1.5 rounded-lg transition-all ${active ? "scale-105" : "active:scale-95"}`}
            >
              <Icon active={active} />
              <span className={`text-[10px] font-semibold transition-colors ${active ? "text-tg-button" : "text-tg-hint"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
