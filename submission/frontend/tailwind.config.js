/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        'sidebar-bg': 'rgb(var(--sidebar-bg) / <alpha-value>)',
        'border-soft': 'rgb(var(--border-soft) / <alpha-value>)',
        'text-primary': 'rgb(var(--text-primary) / <alpha-value>)',
        'text-secondary': 'rgb(var(--text-secondary) / <alpha-value>)',
        'text-tertiary': 'rgb(var(--text-tertiary) / <alpha-value>)',
        'text-quaternary': 'rgb(var(--text-quaternary) / <alpha-value>)',
        
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-hover': 'rgb(var(--accent-hover) / <alpha-value>)',
        'accent-light': 'rgb(var(--accent-light) / <alpha-value>)',
        
        // Drift colors
        'drift-high': 'rgb(var(--drift-high) / <alpha-value>)',
        'drift-medium': 'rgb(var(--drift-medium) / <alpha-value>)',
        'drift-low': 'rgb(var(--drift-low) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'h1': ['28px', { fontWeight: '300', lineHeight: '1.6' }],
        'h2': ['20px', { fontWeight: '400', lineHeight: '1.6' }],
        'body': ['14px', { fontWeight: '400', lineHeight: '1.6' }],
        'small': ['12px', { fontWeight: '400', lineHeight: '1.6' }],
        'table-header': ['11px', { fontWeight: '500', letterSpacing: '0.05em', textTransform: 'uppercase' }],
        'metric-large': ['32px', { fontWeight: '300', lineHeight: '1' }],
        'dashboard-title': ['24px', { fontWeight: '300' }],
      },
      spacing: {
        'card': '24px',
        'table-row-h': '56px',
      },
      borderRadius: {
        'card': '8px',
        'control': '6px',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
        'shadow': 'box-shadow',
        'transform': 'transform',
      },
      transitionDuration: {
        '150': '150ms',
      },
      scale: {
        '101': '1.01',
      },
      boxShadow: {
        'subtle-border': '0 0 0 1px #e5e7eb',
        'none': 'none',
      },
    },
  },
  plugins: [],
};
