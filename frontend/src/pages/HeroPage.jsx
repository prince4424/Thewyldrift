import React, { useEffect, useRef, useState } from "react";

export default function HeroPage() {
  const [offset, setOffset] = useState(0);
  const imgRef = useRef(null);

  useEffect(() => {
    function onScroll() {
      const y = window.scrollY || 0;
      setOffset(Math.min(30, y * 0.12));
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative min-h-[calc(100dvh-120px)] md:grid md:grid-cols-2 md:items-center md:gap-8">
      {/* Decorative botanical blobs */}
      <div className="pointer-events-none absolute left-2 top-6 h-24 w-24 rounded-full bg-gold/25 blur-2xl" />
      <div className="pointer-events-none absolute right-4 top-10 h-28 w-28 rounded-full bg-brown/15 blur-2xl" />

      {/* Watermark */}
      <div className="pointer-events-none absolute left-0 right-0 top-14 select-none text-center font-serif text-[52px] font-semibold text-brown/10">
        The Wyldrift
      </div>

      {/* Hero image */}
      <div className="fade-up flex justify-center pt-10 md:pt-0">
        <div className="relative">
          <img
            ref={imgRef}
            src="https://picsum.photos/seed/wyldrift-jacket/300/420"
            alt="Campaign"
            className="h-[420px] w-[300px] rounded-[28px] object-cover shadow-warm md:h-[520px] md:w-[360px]"
            style={{ transform: `translateY(${offset * -1}px)` }}
          />
        </div>
      </div>

      {/* Bottom content card */}
      <div className="fade-up-delay-2 -mt-10 rounded-t-[28px] bg-white p-5 shadow-warm md:mt-0 md:rounded-[28px]">
        <h1 className="font-serif text-[28px] font-semibold leading-[1.05] text-brownDark">
          Discover Your
          <br />
          Signature Look
        </h1>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          Personal style is about expressing who you are, so embrace your individuality and don't be afraid to stand out
          from the crowd.
        </p>
        <button
          type="button"
          className="tap mt-5 w-full rounded-full bg-brownDark py-3 text-[14px] font-semibold text-cream shadow-soft"
        >
          Shop Now!
        </button>
      </div>
    </div>
  );
}

