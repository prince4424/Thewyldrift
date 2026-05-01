import React from "react";

export default function WyldriftLogo({ className = "", size = 34 }) {
  // SVG wordmark: THE (small) above WYLDRIFT (bold) with subtle gold slash underline.
  // Uses vectors so it looks editorial even without relying on system fonts.
  return (
    <svg
      className={className}
      width={size * 4.2}
      height={size}
      viewBox="0 0 420 100"
      role="img"
      aria-label="The Wyldrift"
    >
      <defs>
        <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9A84C" stopOpacity="0.65" />
          <stop offset="0.5" stopColor="#C9A84C" stopOpacity="1" />
          <stop offset="1" stopColor="#C9A84C" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <text
        x="4"
        y="30"
        fill="rgba(245,240,232,0.78)"
        fontFamily="DM Sans, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="18"
        letterSpacing="6"
      >
        THE
      </text>
      <text
        x="2"
        y="78"
        fill="#F5F0E8"
        fontFamily="Playfair Display, ui-serif, Georgia, serif"
        fontSize="56"
        fontWeight="800"
        letterSpacing="3"
      >
        WYLDRIFT
      </text>

      <path
        d="M10 90 L260 90"
        stroke="url(#gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M260 90 L284 82"
        stroke="url(#gold)"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}

