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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-center items-end gap-4 px-4 pb-3 pt-2">
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path === "/new" && pathname === "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${active ? "" : ""}`}
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md ${
                active
                  ? "bg-tg-button shadow-lg scale-105"
                  : "bg-tg-secondary-bg"
              }`}>
                <Icon active={active} />
              </div>
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
