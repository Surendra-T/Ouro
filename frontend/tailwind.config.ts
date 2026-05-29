import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "oklch(var(--background))",
        foreground: "oklch(var(--foreground))",
        card: "oklch(var(--card))",
        "card-foreground": "oklch(var(--card-foreground))",
        border: "oklch(var(--border))",
        line: "oklch(var(--line))",
        muted: "oklch(var(--muted))",
        "muted-foreground": "oklch(var(--muted-foreground))",
        primary: "oklch(var(--primary))",
        "primary-foreground": "oklch(var(--primary-foreground))",
        accent: "oklch(var(--accent))",
        "accent-foreground": "oklch(var(--accent-foreground))",
        gold: "oklch(var(--gold))",
        destructive: "oklch(var(--destructive))",
        ring: "oklch(var(--ring))",
      },
      borderRadius: {
        xl: "var(--radius)",
        "2xl": "calc(var(--radius) + 4px)",
        lg: "calc(var(--radius) - 2px)",
        md: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "system-ui"],
        serif: ["Lora", "ui-serif", "Georgia"],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 12px 40px rgba(0, 0, 0, 0.08)",
        "soft-dark": "0 20px 60px rgba(0, 0, 0, 0.45)",
        lux: "0 12px 28px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(232, 198, 120, 0.18)",
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-6px)" },
          "100%": { transform: "translateY(0px)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "0.3" },
          "50%": { opacity: "0.6" },
        },
        aurora: {
          "0%": { transform: "translateX(-10%)" },
          "50%": { transform: "translateX(10%)" },
          "100%": { transform: "translateX(-10%)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "pulse-soft": "pulseSoft 6s ease-in-out infinite",
        aurora: "aurora 12s ease-in-out infinite",
      },
    },
  },
  plugins: [],
} satisfies Config;
