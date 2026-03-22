import { Link, useLocation } from "react-router-dom";

export default function BottomNav() {
  const { pathname } = useLocation();

  const tabs = [
    {
      path: "/",
      label: "Главная",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V21h14V9.5" />
        </svg>
      ),
    },
    {
      path: "/orders",
      label: "Заявки",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="6" height="6" rx="1" />
          <rect x="14" y="4" width="6" height="6" rx="1" />
          <rect x="4" y="14" width="6" height="6" rx="1" />
          <rect x="14" y="14" width="6" height="6" rx="1" />
        </svg>
      ),
    },
    {
      path: "/profile",
      label: "Профиль",
      icon: (
        <svg viewBox="0 0 24 24" aria-hidden="true" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c1.8-3.8 5-5.5 8-5.5s6.2 1.7 8 5.5" />
        </svg>
      ),
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") return pathname === "/";
    return pathname.startsWith(path);
  };

  // Hide nav on form pages
  if (pathname === "/fbs" || pathname === "/fbo" || pathname.startsWith("/success")) {
    return null;
  }

  return (
    <nav className="fixed left-1/2 bottom-0 -translate-x-1/2 w-full max-w-[420px] bg-nav-bg border-t border-gray-200 z-50" style={{ padding: "12px 10px calc(14px + env(safe-area-inset-bottom))" }}>
      <div className="flex items-center gap-2">
        <div className="w-2/3 grid grid-cols-3 gap-1">
          {tabs.map((tab) => {
            const active = isActive(tab.path);
            return (
              <Link
                key={tab.path}
                to={tab.path}
                className={`flex flex-col items-center text-center text-xs py-1.5 rounded-xl transition-all ${active ? "text-accent font-bold" : "text-heading"}`}
              >
                <span className="block mb-1">{tab.icon}</span>
                {tab.label}
              </Link>
            );
          })}
        </div>
        <div className="w-1/3 bg-card rounded-[20px] min-h-[64px] flex items-center justify-center text-xl font-semibold text-heading">
          0 ₽
        </div>
      </div>
    </nav>
  );
}
