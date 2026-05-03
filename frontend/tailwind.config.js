/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F2EDE6",
        surface: "#FFFFFF",
        brown: "#5C3D2E",
        espresso: "#2C1A0E",
        brownDark: "#3B2314",
        gold: "#C9A460",
        text: "#1A1A1A",
        muted: "#9A8C82",
        badge: "#E8622A",
      },
      fontFamily: {
        serif: ["Cormorant Garamond", "Playfair Display", "serif"],
        sans: ["DM Sans", "Nunito Sans", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0,0,0,0.07)",
        warm: "0 18px 50px rgba(92,61,46,0.12)",
      },
      borderRadius: {
        card: "20px",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: 0, transform: "translateY(10px)" }, "100%": { opacity: 1, transform: "translateY(0)" } },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        navDot: {
          "0%": { transform: "translateX(var(--nav-from, 0px))" },
          "100%": { transform: "translateX(var(--nav-to, 0px))" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(201,164,96,0.0)" },
          "50%": { boxShadow: "0 0 0 8px rgba(201,164,96,0.18)" },
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

