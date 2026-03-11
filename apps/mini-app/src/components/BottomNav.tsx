import { Link, useLocation } from "react-router-dom";

const tabs = [
  { path: "/new", label: "Заявка", icon: PlusIcon },
  { path: "/history", label: "История", icon: HistoryIcon },
  { path: "/info", label: "Информация", icon: InfoIcon },
];

function PlusIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function HistoryIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <line x1="7" y1="8" x2="17" y2="8" />
      <line x1="7" y1="12" x2="17" y2="12" />
      <line x1="7" y1="16" x2="13" y2="16" />
    </svg>
  );
}

function InfoIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      className={`w-6 h-6 ${active ? "text-tg-button" : "text-tg-hint"}`}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-2 left-2 right-2 bg-tg-bg border border-tg-secondary-bg z-50 rounded-2xl shadow-lg">
      <div className="flex justify-around items-center h-14 max-w-md mx-auto">
        {tabs.map((tab) => {
          const active = pathname === tab.path || (tab.path === "/new" && pathname === "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-0.5 px-3 py-1"
            >
              <Icon active={active} />
              <span className={`text-[11px] font-medium ${active ? "text-tg-button" : "text-tg-hint"}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
