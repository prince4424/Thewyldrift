import React from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, MessageCircle, Moon, Shield, Sun, Zap } from "lucide-react";
import { WHATSAPP_BUSINESS_NUMBER } from "../lib/storefront.js";
import "../wyldrift-landing.css";

const THEME_KEY = "wyldrift-theme";

const RULES = [
  {
    title: "WhatsApp orders only",
    body: "All drop entries and orders are confirmed on WhatsApp. DM us your name, size, colour, and delivery area before payment.",
  },
  {
    title: "First come, first served",
    body: "Limited pieces per drop. Your slot is locked only after we confirm availability in chat — not when you add to cart elsewhere.",
  },
  {
    title: "Tricity delivery",
    body: "60-minute local delivery applies to Chandigarh, Mohali & Panchkula on in-stock items. Outstation timelines shared at checkout.",
  },
  {
    title: "Size & colour final",
    body: "Once confirmed on WhatsApp, size and colour cannot be changed. Double-check swatches before you hit send.",
  },
  {
    title: "Payment",
    body: "COD available on most Tricity orders. UPI accepted after order confirmation. No payment links from unofficial accounts.",
  },
  {
    title: "Authenticity",
    body: "Every piece ships from WYLDRIFT with original wash & print quality. Report suspicious sellers — we never sell via random DMs.",
  },
];

const GUIDELINES = [
  "Join the drop only through official WYLDRIFT WhatsApp or this website.",
  "One active order per customer during flash drops unless approved by our team.",
  "Exchanges within 7 days for unworn items with tags — sale drops may be final sale.",
  "No reselling or bulk hoarding during limited releases; repeat offenders may be blocked.",
  "Be respectful in chat — abusive messages will not be processed.",
  "Delivery slots are shared in real time; please be reachable on the number you provide.",
  "By joining, you agree to receive order updates and drop alerts on WhatsApp.",
];

function waJoinUrl() {
  const text =
    "Hi WYLDRIFT! I want to join the drop — please share availability, sizes & delivery options for Tricity.";
  return `https://wa.me/${WHATSAPP_BUSINESS_NUMBER}?text=${encodeURIComponent(text)}`;
}

export default function JoinDropPage() {
  const [theme, setTheme] = React.useState(() => {
    if (typeof window === "undefined") return "dark";
    return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
  });
  const [spinning, setSpinning] = React.useState(false);

  const toggleTheme = () => {
    setSpinning(true);
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
    window.setTimeout(() => setSpinning(false), 320);
  };

  return (
    <div
      className="wyldrift-landing min-h-screen bg-[var(--bg-primary)] font-sans text-[var(--text-primary)] antialiased"
      data-theme={theme}
    >
      <header className="fixed inset-x-0 top-0 z-[1000] border-b border-[var(--border)] bg-[var(--bg-primary)]/80 backdrop-blur-[10px]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-bold tracking-[0.2em] text-[var(--accent)]">
            WYLDRIFT
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className={`flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--accent)] text-[var(--accent)] transition-transform hover:scale-110 ${spinning ? "rotate-180" : ""}`}
          >
            {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-24 sm:px-6">
        <div className="wyld-animate-slide-up text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[var(--accent)]">Join the drop</p>
          <h1 className="mt-3 text-3xl font-bold sm:text-4xl">Rules &amp; Guidelines</h1>
          <p className="mx-auto mt-4 max-w-xl text-[var(--text-secondary)]">
            Everything you need before joining the next Wyldrift drop — fair releases, fast delivery, zero drama.
          </p>
        </div>

        <div className="wyld-animate-pulse-badge mx-auto mt-8 inline-flex rounded-full border border-[var(--accent)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          ⚡ 60-MIN LOCAL DELIVERY • TRICITY
        </div>

        <section className="mt-12" aria-labelledby="rules-heading">
          <div className="mb-6 flex items-center gap-2">
            <Shield className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 id="rules-heading" className="text-lg font-bold uppercase tracking-wider">
              Drop rules
            </h2>
          </div>
          <ul className="space-y-4">
            {RULES.map((rule, i) => (
              <li
                key={rule.title}
                className="wyld-animate-slide-up rounded-xl border border-[var(--border)] bg-[var(--bg-secondary)] p-5"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  <div>
                    <h3 className="font-semibold text-[var(--text-primary)]">{rule.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{rule.body}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-12" aria-labelledby="guidelines-heading">
          <div className="mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
            <h2 id="guidelines-heading" className="text-lg font-bold uppercase tracking-wider">
              Community guidelines
            </h2>
          </div>
          <ol className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--glass)] p-6 backdrop-blur-xl">
            {GUIDELINES.map((line, i) => (
              <li key={line} className="flex gap-3 text-sm leading-relaxed text-[var(--text-secondary)]">
                <span className="font-bold tabular-nums text-[var(--accent)]">{String(i + 1).padStart(2, "0")}</span>
                <span>{line}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-12 rounded-2xl border border-[var(--border)] bg-[var(--bg-secondary)] p-6 text-center sm:p-10">
          <h2 className="text-xl font-bold">Ready to join?</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Tap below to open WhatsApp. Mention your size, colour &amp; Tricity location.
          </p>
          <a
            href={waJoinUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-[48px] w-full max-w-md items-center justify-center gap-2 rounded-lg bg-[var(--accent)] px-6 text-sm font-bold uppercase tracking-wider text-[#0a0a0a] shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl sm:w-auto"
          >
            <MessageCircle className="h-5 w-5" />
            Join on WhatsApp
          </a>
          <Link
            to="/"
            className="mt-4 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
          >
            ← Back to home
          </Link>
        </section>
      </main>
    </div>
  );
}
