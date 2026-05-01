import React from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav.jsx";

export default function RouteShell({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="min-h-dvh bg-cream">
      <div className="mx-auto w-full max-w-[390px] px-4 pb-24 pt-4 sm:max-w-[420px] md:max-w-[860px] md:px-8 lg:max-w-[1100px]">
        {children}
      </div>
      {/* Persist across all screens */}
      {pathname.startsWith("/admin") ? null : <BottomNav />}
    </div>
  );
}

