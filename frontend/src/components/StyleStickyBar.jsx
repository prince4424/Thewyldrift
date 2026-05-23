import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import StartStylingButton from "./StartStylingButton.jsx";

export default function StyleStickyBar() {
  const { pathname } = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/product/")) {
      setVisible(false);
      return undefined;
    }

    const onScroll = () => setVisible(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  if (pathname.startsWith("/admin") || pathname.startsWith("/product/") || !visible) return null;

  return (
    <div className="style-sticky-bar" role="complementary" aria-label="Quick order">
      <StartStylingButton fullWidth />
    </div>
  );
}
