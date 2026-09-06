import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        qubink: {
          navy: "#082F3F",
          teal: "#00A99D",
          mint: "#42D6BD",
          softmint: "#E9FBF7",
          ice: "#F6FAFA",
          dark: "#102A33",
          muted: "#6B7C83",
          success: "#16A579",
          warning: "#F2A93B",
          error: "#E05252",
        },
      },
      borderRadius: {
        'card': '18px',
        'badge': '9999px',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(8, 47, 63, 0.06), 0 2px 6px -1px rgba(8, 47, 63, 0.04)',
        'elevated': '0 12px 30px -4px rgba(8, 47, 63, 0.12), 0 4px 10px -2px rgba(8, 47, 63, 0.05)',
        'glow': '0 0 20px rgba(0, 169, 157, 0.25)',
      },
    },
  },
  plugins: [],
};
export default config;
