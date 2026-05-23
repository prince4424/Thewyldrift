import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { makeStartStylingUrl } from "../lib/storefront.js";

const INSTAGRAM_URL = "https://instagram.com";

function WhatsAppIcon() {
  return (
    <svg className="wyldrift-footer__icon" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.02 3.2A12.7 12.7 0 0 0 5.1 22.38L3.5 28.8l6.56-1.54a12.72 12.72 0 1 0 5.96-24.06Zm0 22.9c-2 0-3.86-.58-5.44-1.58l-.42-.26-3.9.92.94-3.8-.28-.44A10.1 10.1 0 1 1 16.02 26.1Zm5.86-7.56c-.32-.16-1.9-.94-2.2-1.04-.3-.12-.52-.16-.74.16-.22.32-.84 1.04-1.04 1.26-.18.22-.38.24-.7.08-.32-.16-1.36-.5-2.58-1.6-.96-.86-1.6-1.9-1.8-2.22-.18-.32-.02-.5.14-.66.14-.14.32-.38.48-.56.16-.2.22-.32.32-.54.12-.22.06-.4-.02-.56-.08-.16-.74-1.78-1.02-2.44-.26-.64-.54-.56-.74-.56h-.64c-.22 0-.56.08-.86.4-.3.32-1.14 1.12-1.14 2.72s1.16 3.14 1.32 3.36c.16.22 2.28 3.48 5.52 4.88.78.34 1.38.54 1.84.68.78.24 1.48.2 2.04.12.62-.1 1.9-.78 2.16-1.52.26-.74.26-1.38.18-1.52-.08-.14-.3-.22-.62-.38Z"
      />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="wyldrift-footer__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2.2c2.7 0 3 .01 4.04.06 1.02.05 1.57.22 1.94.37.49.19.84.42 1.2.78.37.37.6.72.78 1.2.15.37.32.92.37 1.94.05 1.05.06 1.34.06 4.04s-.01 3-.06 4.04c-.05 1.02-.22 1.57-.37 1.94a3.1 3.1 0 0 1-.78 1.2 3.1 3.1 0 0 1-1.2.78c-.37.15-.92.32-1.94.37-1.05.05-1.34.06-4.04.06s-3-.01-4.04-.06c-1.02-.05-1.57-.22-1.94-.37a3.1 3.1 0 0 1-1.2-.78 3.1 3.1 0 0 1-.78-1.2c-.15-.37-.32-.92-.37-1.94C2.21 15 2.2 14.7 2.2 12s.01-3 .06-4.04c.05-1.02.22-1.57.37-1.94.19-.49.42-.84.78-1.2.37-.37.72-.6 1.2-.78.37-.15.92-.32 1.94-.37C9 2.21 9.3 2.2 12 2.2Zm0 1.8c-2.65 0-2.96.01-4 .06-.9.04-1.39.2-1.71.33-.43.17-.74.37-1.06.69-.32.32-.52.63-.69 1.06-.13.32-.29.81-.33 1.71-.05 1.04-.06 1.35-.06 4s.01 2.96.06 4c.04.9.2 1.39.33 1.71.17.43.37.74.69 1.06.32.32.63.52 1.06.69.32.13.81.29 1.71.33 1.04.05 1.35.06 4 .06s2.96-.01 4-.06c.9-.04 1.39-.2 1.71-.33.43-.17.74-.37 1.06-.69.32-.32.52-.63.69-1.06.13-.32.29-.81.33-1.71.05-1.04.06-1.35.06-4s-.01-2.96-.06-4c-.04-.9-.2-1.39-.33-1.71a2.8 2.8 0 0 0-.69-1.06 2.8 2.8 0 0 0-1.06-.69c-.32-.13-.81-.29-1.71-.33-1.04-.05-1.35-.06-4-.06Zm0 3.35a5.45 5.45 0 1 1 0 10.9 5.45 5.45 0 0 1 0-10.9Zm0 1.8a3.65 3.65 0 1 0 0 7.3 3.65 3.65 0 0 0 0-7.3Zm5.92-3.57a1.27 1.27 0 1 1-2.54 0 1.27 1.27 0 0 1 2.54 0Z"
      />
    </svg>
  );
}

export default function WyldriftFooter() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setVisible(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  return (
    <footer className={`wyldrift-footer${visible ? " wyldrift-footer--visible" : ""}`}>
      <div className="wyldrift-footer__inner">
        <div className="wyldrift-footer__brand">
          <Link className="wyldrift-footer__brand-link" to="/" aria-label="The Wyldrift home">
            <span className="wyldrift-footer__brand-the">The</span>
            <span className="wyldrift-footer__brand-name">Wyldrift</span>
            <span className="wyldrift-footer__brand-rule" aria-hidden="true" />
          </Link>
          <p className="wyldrift-footer__tagline">
            <em>Wear what you mean.</em>
          </p>
          <p className="wyldrift-footer__sub-lead">Curated combos &amp; singles</p>
          <p className="wyldrift-footer__blurb">
            Limited-run coord sets and everyday staples — put together so getting dressed feels easy, not loud.
            New pieces every week. Order on WhatsApp, delivered across India.
          </p>
        </div>

        <div className="wyldrift-footer__social-block">
          <p className="wyldrift-footer__social-label">Connect</p>
          <nav className="wyldrift-footer__social" aria-label="Social links">
            <a
              className="wyldrift-footer__pill wyldrift-footer__pill--wa"
              href={makeStartStylingUrl()}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon />
              <span>WhatsApp</span>
            </a>
            <a
              className="wyldrift-footer__pill wyldrift-footer__pill--ig"
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
            >
              <InstagramIcon />
              <span>Instagram</span>
            </a>
          </nav>
        </div>
      </div>

      <p className="wyldrift-footer__copy">© 2026 The Wyldrift · Made with love in India</p>
    </footer>
  );
}
