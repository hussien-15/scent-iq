import type { Config } from 'tailwindcss';

// ScentIQ design tokens, per the platform's luxury-first principle:
// deep black, a single premium gold accent, and subtle off-white text.
// No competing hues — restraint is the point (Apple / Dior / Chanel register).
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0A09',
          soft: '#141311',
          line: '#242220',
        },
        parchment: {
          DEFAULT: '#F4F1EA',
          dim: '#B9B4A8',
        },
        gold: {
          DEFAULT: '#C9A227',
          bright: '#E3C158',
          dim: '#8A7024',
        },
        // Studio-only accent — Perfume Studio uses gold sparingly and blue
        // for interactive/system state (active nav, links, info), so the
        // admin surface reads as distinct "tool" chrome, not more storefront.
        studioBlue: {
          DEFAULT: '#5B8DEF',
          dim: '#3A5FA8',
        },
        smoke: '#8B8578',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'Times New Roman', 'serif'],
        body: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      letterSpacing: {
        widest2: '0.22em',
      },
      backgroundImage: {
        vignette:
          'radial-gradient(120% 100% at 50% 0%, rgba(201,162,39,0.08) 0%, rgba(10,10,9,0) 60%)',
      },
    },
  },
  plugins: [],
};

export default config;
