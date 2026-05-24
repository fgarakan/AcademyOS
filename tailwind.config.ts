import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Academy OS design tokens — Manus aesthetic
        base: '#030506',
        surface: {
          DEFAULT: '#07090c',
          raised: '#0d1117',
          overlay: '#121820',
        },
        border: {
          DEFAULT: '#1a2030',
          subtle: '#111820',
          strong: '#243040',
        },
        // Primary accent: cyan/aqua (replaces lime green)
        lime: {
          DEFAULT: '#11d9df',
          dim: 'rgba(17,217,223,0.20)',
          muted: 'rgba(17,217,223,0.08)',
        },
        text: {
          primary: '#f4f7f8',
          secondary: '#a3aab4',
          muted: '#7a8898',
          disabled: '#3a4050',
        },
        status: {
          red: '#ff4d55',
          orange: '#ffb020',
          green: '#52e36f',
          blue: '#0A84FF',
          purple: '#b56cff',
          amber: '#ffb020',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      borderRadius: {
        card: '1rem',
        xl: '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        lime: '0 0 24px rgba(17,217,223,0.15)',
        'lime-strong': '0 0 32px rgba(17,217,223,0.25)',
        card: '0 1px 4px rgba(0,0,0,0.6)',
        elevated: '0 4px 20px rgba(0,0,0,0.7)',
        cyan: '0 0 20px rgba(17,217,223,0.12)',
        'cyan-strong': '0 0 32px rgba(17,217,223,0.22)',
      },
      keyframes: {
        'pulse-lime': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(4px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
      },
      animation: {
        'pulse-lime': 'pulse-lime 2s ease-in-out infinite',
        'fade-in': 'fade-in 150ms ease-out',
        skeleton: 'skeleton 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
