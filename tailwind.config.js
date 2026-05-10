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
