import React, { useMemo } from "react";
import { Link } from "react-router-dom";

function IconButton({ children, label, to }) {
  const className = "tap grid h-10 w-10 place-items-center rounded-full bg-white shadow-soft";
  if (to) {
    return (
      <Link to={to} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" className={className} aria-label={label}>
      {children}
    </button>
  );
}

export default function MembershipPage() {
  const rewards = useMemo(
    () => [
      { title: "$15 CASHBACK ON PAYMENT", points: 1000, action: "CLAIM", claimable: true },
      { title: "$40 CASHBACK ON PAYMENT", points: 3000, action: "EARN", claimable: false },
    ],
    []
  );

  return (
    <div className="space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-6 md:space-y-0">
      {/* Header */}
      <header className="fade-up flex items-center justify-between pt-2 md:col-span-2">
        <IconButton label="Back" to="/">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brownDark" fill="none" aria-hidden="true">
            <path d="M15 6 9 12l6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </IconButton>
        <div className="text-[11px] font-semibold tracking-[0.22em] text-muted">MEMBERSHIP</div>
        <IconButton label="Info">
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-brownDark" fill="none" aria-hidden="true">
            <path d="M12 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M12 7.2h.01" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
            <path d="M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9Z" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </IconButton>
      </header>

      {/* Gold Card */}
      <section className="fade-up-delay-1 overflow-hidden rounded-[22px] shadow-warm">
        <div className="gold-shimmer bg-gradient-to-br from-gold to-[#D4B483] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="font-serif text-[18px] font-semibold">Alex Warren – Gold</div>
            <div className="text-right text-[12px] opacity-90">
              <div className="text-[10px] tracking-[0.18em]">TOTAL POINTS</div>
              <div className="font-semibold">1500</div>
            </div>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            <Star />
            <Star />
            <Star />
          </div>

          <div className="mt-4 text-center text-[11px] opacity-90">
            Using Points Will Not Affect Level Progression
          </div>
        </div>
      </section>

      {/* Rewards */}
      <section className="fade-up-delay-2 rounded-[22px] bg-white p-4 shadow-soft">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-semibold tracking-[0.22em] text-muted">REWARDS</div>
          <button type="button" className="text-[11px] font-semibold tracking-[0.14em] text-gold">
            VIEW ALL
          </button>
        </div>

        <div className="mt-3 divide-y divide-black/5">
          {rewards.map((r) => (
            <div key={r.title} className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#2ECC71]/12">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#2ECC71]" fill="none" aria-hidden="true">
                    <path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z" stroke="currentColor" strokeWidth="1.6" />
                    <path d="M9 12h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </div>
                <div>
                  <div className="text-[12px] font-semibold text-brownDark">{r.title}</div>
                  <div className="mt-1 text-[12px] text-muted">{r.points} points</div>
                </div>
              </div>

              {r.claimable ? (
                <button
                  type="button"
                  className="tap rounded-full bg-gold px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-espresso shadow-soft animate-pulseGlow"
                >
                  CLAIM
                </button>
              ) : (
                <button
                  type="button"
                  className="tap rounded-full border border-gold/60 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-gold"
                >
                  EARN
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Exclusive Offer */}
      <section className="fade-up-delay-3 grid grid-cols-[96px_1fr] gap-3 rounded-2xl bg-white p-3 shadow-soft md:col-span-2 md:grid-cols-[140px_1fr]">
        <img
          src="https://picsum.photos/seed/wyldrift-leather/120/140"
          alt="Leather jacket"
          className="h-[112px] w-[96px] rounded-2xl object-cover md:h-[140px] md:w-[140px]"
        />
        <div className="grid grid-rows-[auto_1fr] gap-2">
          <div>
            <div className="text-[10px] font-semibold tracking-[0.22em] text-muted">ONLY FOR ME</div>
            <div className="mt-1 text-[12px] font-semibold text-brownDark">
              USE CODE: <span className="font-bold">GET20%OFF</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            <div className="rounded-2xl bg-espresso px-3 py-2 text-[12px] font-bold text-cream">
              UP TO
              <br />
              20% OFF
            </div>
            <div className="text-[12px] text-muted">Limited time</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7 text-white drop-shadow" fill="currentColor" aria-hidden="true">
      <path d="M12 17.3 6.5 20.2l1.1-6.2L3 9.6l6.3-.9L12 3l2.7 5.7 6.3.9-4.6 4.4 1.1 6.2L12 17.3Z" />
    </svg>
  );
}

