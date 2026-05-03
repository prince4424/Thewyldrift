import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";

const tabs = [
  { to: "/", label: "HOME", icon: HomeIcon },
  { to: "/hero", label: "CATEGORIES", icon: GridIcon },
  { to: "/membership", label: "CART", icon: CartIcon },
  { to: "/admin", label: "PROFILE", icon: UserIcon },
];

export default function BottomNav() {
  const { pathname } = useLocation();
  const activeIndex = useMemo(() => {
    const i = tabs.findIndex((t) => (t.to === "/" ? pathname === "/" : pathname.startsWith(t.to)));
    return i === -1 ? 0 : i;
  }, [pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-4">
      <div className="mx-auto w-full max-w-[390px] rounded-t-[24px] rounded-b-[24px] bg-espresso px-4 py-3 shadow-warm sm:max-w-[420px] md:max-w-[860px] lg:max-w-[1100px]">
        <div className="relative grid grid-cols-4 items-end">
          <div
            className="absolute -top-[2px] left-0 h-[2px] w-1/4"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          >
            <div className="mx-auto mt-0.5 h-1.5 w-1.5 rounded-full bg-gold" />
          </div>

          {tabs.map((t, idx) => {
            const isActive = idx === activeIndex;
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`tap flex flex-col items-center gap-1 rounded-2xl py-2 text-[10px] tracking-[0.24em] ${
                  isActive ? "text-white" : "text-white/60"
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? "text-white" : "text-white/70"}`} />
                <span className="font-semibold">{t.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

function HomeIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10.5 12 4l8 6.5V20a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 20v-9.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M9.25 21.5v-6.2c0-.9.7-1.6 1.6-1.6h2.3c.9 0 1.6.7 1.6 1.6v6.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function GridIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 4.5h6.8v6.8H4.5V4.5Zm8.2 0h6.8v6.8h-6.8V4.5ZM4.5 12.7h6.8v6.8H4.5v-6.8Zm8.2 0h6.8v6.8h-6.8v-6.8Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CartIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7.5 7.5V6.8a4.5 4.5 0 0 1 9 0v.7" stroke="currentColor" strokeWidth="1.6" />
      <path d="M6 9h12l-1 12H7L6 9Z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function UserIcon({ className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 12a4.2 4.2 0 1 0-4.2-4.2A4.2 4.2 0 0 0 12 12Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.8 20.5c1.6-3.3 4.2-5.1 7.2-5.1s5.6 1.8 7.2 5.1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

