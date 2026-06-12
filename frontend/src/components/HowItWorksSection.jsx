import React, { useEffect, useRef } from "react";
import StartStylingButton from "./StartStylingButton.jsx";

const STEPS = [
  {
    num: "01",
    title: "Explore the collection",
    desc: "Browse new drops, preview every colourway, and lock in the size that fits your vibe.",
  },
  {
    num: "02",
    title: "Order on WhatsApp",
    desc: "Tap Order on WhatsApp with your colour and size ready — we confirm stock and delivery in minutes.",
  },
  {
    num: "03",
    title: "Delivered to your door",
    desc: "Ships across India in 3–5 days. Cash on delivery available on most orders.",
  },
];

const BUBBLES = [
  {
    type: "business",
    text: "Hi! Welcome to The Wyldrift 👋\nReady to shop the new collection?\n• Combo sets\n• Acid wash tees\n• Latest drops",
    time: "10:32",
  },
  { type: "user", text: "I’d like a combo set — Size M", time: "10:33" },
  {
    type: "business",
    text: "Perfect — sending our bestsellers now 🔥",
    time: "10:33",
    card: true,
  },
  { type: "user", text: "Black Coord Set, Size M please", time: "10:34" },
  {
    type: "business",
    text: "✅ Confirmed! Delivery in 3–5 days. COD available.",
    time: "10:34",
  },
];

export default function HowItWorksSection() {
  const layoutRef = useRef(null);

  useEffect(() => {
    const el = layoutRef.current;
    if (!el) return undefined;

    const section = el.closest(".how-it-works");
    const mark = () => section?.classList.add("how-it-works--visible");

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          mark();
          io.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px 8% 0px" }
    );

    io.observe(el);
    const t = window.setTimeout(mark, 1200);
    return () => {
      window.clearTimeout(t);
      io.disconnect();
    };
  }, []);

  return (
    <section id="how-it-works" className="how-it-works" aria-labelledby="how-it-works-title">
      <div className="how-it-works-intro">
        <span className="how-it-works-kicker">How to order</span>
        <h2 id="how-it-works-title" className="how-it-works-heading">
          <em>From browse to doorstep</em>
        </h2>
        <p className="how-it-works-lead">
          No checkout forms. No waiting. Pick your fit on the site, confirm on WhatsApp, and we handle the rest.
        </p>
      </div>

      <div className="how-it-works-layout" ref={layoutRef}>
        <ol className="how-it-works-steps">
          {STEPS.map((step) => (
            <li key={step.num} className="how-it-works-step">
              <span className="how-it-works-step-num" aria-hidden="true">
                {step.num}
              </span>
              <div className="how-it-works-step-copy">
                <h3 className="how-it-works-step-title">{step.title}</h3>
                <p className="how-it-works-step-desc">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <aside className="how-it-works-demo" aria-label="Example WhatsApp order chat">
          <div className="wa-chat-mockup">
            <div className="wa-chat-mockup-header">
              <span className="wa-chat-mockup-avatar" aria-hidden="true">
                W
              </span>
              <div className="wa-chat-mockup-meta">
                <span className="wa-chat-mockup-title">The Wyldrift</span>
                <span className="wa-chat-mockup-sub">Business · typically replies in minutes</span>
              </div>
            </div>
            <div className="wa-chat-mockup-body">
              {BUBBLES.map((b, i) => (
                <div
                  key={i}
                  className={`wa-chat-bubble-wrap wa-chat-bubble-wrap--${b.type}`}
                  style={{ animationDelay: `${0.1 + i * 0.1}s` }}
                >
                  <div className={`wa-chat-bubble wa-chat-bubble--${b.type}`}>
                    {b.card ? (
                      <div className="wa-chat-product-card">
                        <span className="wa-chat-product-card-img" aria-hidden="true" />
                        <span className="wa-chat-product-card-name">Black Coord Set</span>
                        <span className="wa-chat-product-card-price">₹1,899</span>
                      </div>
                    ) : (
                      <p>{b.text}</p>
                    )}
                    <span className="wa-chat-time">{b.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <div className="how-it-works-footer">
        <p className="how-it-works-footnote">Need help with sizing, styling or delivery? Message us anytime — we reply fast.</p>
        <StartStylingButton className="btn-style-primary--how-it-works" />
      </div>
    </section>
  );
}
