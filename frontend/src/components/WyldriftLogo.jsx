import React, { useId } from "react";

export default function WyldriftLogo({ className = "", size = 34, tone = "dark" }) {
  const uid = useId();
  const gradId = `wyldrift-gold-${uid.replace(/[^a-zA-Z0-9]/g, "")}`;
  const small = tone === "light" ? "rgba(20,20,20,0.55)" : "rgba(245,240,232,0.78)";
  const main = tone === "light" ? "#141414" : "#F5F0E8";

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
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C9A84C" stopOpacity="0.65" />
          <stop offset="0.5" stopColor="#C9A84C" stopOpacity="1" />
          <stop offset="1" stopColor="#C9A84C" stopOpacity="0.65" />
        </linearGradient>
      </defs>

      <text
        x="4"
        y="30"
        fill={small}
        fontFamily="DM Sans, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="18"
        letterSpacing="6"
      >
        THE
      </text>
      <text
        x="2"
        y="78"
        fill={main}
        fontFamily="Playfair Display, ui-serif, Georgia, serif"
        fontSize="56"
        fontWeight="800"
        letterSpacing="3"
      >
        WYLDRIFT
      </text>

      <path
        d="M10 90 L260 90"
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.95"
      />
      <path
        d="M260 90 L284 82"
        stroke={`url(#${gradId})`}
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.95"
      />
    </svg>
  );
}

