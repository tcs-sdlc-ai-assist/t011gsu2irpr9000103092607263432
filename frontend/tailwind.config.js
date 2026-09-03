/** Configure Tailwind's source scanning for the WriteSpace SPA. */
export default {
  darkMode: "class",
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Lexend Deca', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#191b1f',
          900: '#222429',
          800: '#2b2e34',
        },
        signal: {
          400: '#2c79ea',
          500: '#1d6ee3',
          600: '#175fc8',
        },
      },
    },
  },
  plugins: [],
};
