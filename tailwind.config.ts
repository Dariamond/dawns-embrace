import type { Config } from "tailwindcss";

/**
 * Dawns Embrace Tailwind configuration.
 *
 * Tailwind CSS v4 is configured CSS-first via the `@theme` block in
 * `src/app/globals.css`; the brand color tokens live there as the source of
 * truth. This file mirrors those tokens and declares content paths for tooling
 * and editor integrations that still read a config file.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "gulf-blue": "#060E6E", // primary
        "persian-blue": "#1F27E9", // secondary
        "brand-white": "#FFFFFF", // accent
      },
    },
  },
  plugins: [],
};

export default config;
