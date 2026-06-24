/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary:       '#A855F7',
        'primary-light': '#C084FC',
        night:         '#000000',
        surface:       '#121212',
        card:          '#181818',
        'card-hover':  '#282828',
        muted:         '#B3B3B3',
        yellow:        '#ede32e',
        red:           '#EF4444',
        green:         '#10B981',
        blue:          '#3B82F6',
        orange:        '#F97316',
        pink:          '#EC4899',
        cyan:          '#06B6D4',
        teal:          '#14B8A6',
        indigo:        '#6366F1',
        lime:          '#84CC16',
      },
      borderRadius: {
        pill: '500px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
