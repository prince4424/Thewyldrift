/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F2EBE0",
        surface: "#14100C",
        brown: "#5C3D2E",
        espresso: "#0D0A08",
        brownDark: "#2C1A0E",
        gold: "#D4AF37",
        champagne: "#E8D5A3",
        burgundy: "#722F37",
        text: "#F2EBE0",
        muted: "#9A8C82",
        badge: "#C47A3A",
        wyld: {
          dark: "#0D0A08",
          light: "#F2EBE0",
          accent: "#D4AF37",
        },
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Playfair Display", "serif"],
        sans: ["Outfit", "DM Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.07)",
        warm: "0 18px 50px rgba(92,61,46,0.12)",
        luxury: "0 24px 60px rgba(212,175,55,0.15)",
      },
      borderRadius: {
        card: "12px",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        navDot: {
          "0%": { transform: "translateX(var(--nav-from, 0px))" },
          "100%": { transform: "translateX(var(--nav-to, 0px))" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(212,175,55,0.0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(212,175,55,0.18)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 520ms ease both",
        shimmer: "shimmer 3s linear infinite",
        pulseGlow: "pulseGlow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

