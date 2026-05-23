import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WyldriftLogo from "./WyldriftLogo.jsx";
import WyldriftFooter from "./WyldriftFooter.jsx";
import StartStylingButton from "./StartStylingButton.jsx";
const MARQUEE_TEXT =
  "Free delivery on orders over ₹999 · WhatsApp us to check availability · New arrivals every week";

export function StorefrontMarquee() {
  return (
    <div className="store-marquee" aria-hidden="true">
      <div className="store-marquee-track">
        <span>{MARQUEE_TEXT}</span>
        <span aria-hidden="true">{MARQUEE_TEXT}</span>
      </div>
    </div>
  );
}

export function StorefrontHeader({ homeLink = "#top" }) {
  const [scrolled, setScrolled] = useState(false);
  const [logoOnDark, setLogoOnDark] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 80);
      setLogoOnDark(y <= 80 && !mq.matches);
    };
    onScroll();
    mq.addEventListener("change", onScroll);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      mq.removeEventListener("change", onScroll);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const logo = (
    <WyldriftLogo className="logo-svg logo-svg--header" size={28} tone={logoOnDark ? "dark" : "light"} />
  );

  return (
    <header
      className={`store-header store-header--editorial${scrolled ? " store-header--scrolled" : ""}${logoOnDark ? " store-header--on-hero" : ""}`}
    >
      {homeLink.startsWith("/") ? (
        <Link className="store-logo" to={homeLink} aria-label="The Wyldrift home">
          {logo}
        </Link>
      ) : (
        <a className="store-logo" href={homeLink} aria-label="The Wyldrift home">
          {logo}
        </a>
      )}
      <StartStylingButton className="btn-style-primary--header" />
    </header>
  );
}

export function StorefrontFooter() {
  return <WyldriftFooter />;
}

export function useScrollReveal(deps = []) {
  useEffect(() => {
    const markVisible = (el) => {
      el.classList.add("visible");
    };

    const showIfInView = (el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        markVisible(el);
        return true;
      }
      return false;
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            markVisible(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.02, rootMargin: "0px 0px 12% 0px" }
    );

    const observe = () => {
      document.querySelectorAll(".reveal:not(.visible)").forEach((el) => {
        if (!showIfInView(el)) io.observe(el);
      });
    };

    observe();
    const t1 = window.requestAnimationFrame(observe);
    const t2 = window.setTimeout(observe, 120);
    const t3 = window.setTimeout(() => {
      document.querySelectorAll(".reveal:not(.visible)").forEach(markVisible);
    }, 900);
    return () => {
      window.cancelAnimationFrame(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
      io.disconnect();
    };
  }, deps);
}
