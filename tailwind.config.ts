import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        deepOceanBlue: "#123047",
        stayoraTeal: "#087F8C",
        brightTeal: "#22B8B0",
        coral: "#F4775B",
        goldenYellow: "#F4B942",
        warmWhite: "#FAF9F6",
        pureWhite: "#FFFFFF",
        primaryText: "#202B36",
        secondaryText: "#687786",
        border: "#E3E8EC",
        successGreen: "#21865B",
        warningAmber: "#D98B12",
        errorRed: "#D64545",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "#087F8C",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#22B8B0",
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#F4775B",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        destructive: {
          DEFAULT: "#D64545",
          foreground: "#FFFFFF",
        },
        ring: "#087F8C",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
