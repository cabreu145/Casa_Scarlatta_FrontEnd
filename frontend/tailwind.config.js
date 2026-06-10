/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        vino:   '#7B1E22',
        crema:  '#F5EDE8',
        blush:  '#EDE0D9',
        taupe:  '#A08878',
        nude:   '#EFE3DC',
        wine: {
          50:  '#FAF5F2',
          100: '#F5EDE8',
          200: '#EDE0D9',
          300: '#D4B5AA',
          400: '#B8947E',
          500: '#9A7B6B',
          600: '#7A6560',
          700: '#7B1E22',
          800: '#5C1018',
          900: '#3D1A20',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        serif:   ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans:    ['"Inter"', '"DM Sans"', 'Helvetica', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'float':  '0 2px 4px rgba(0,0,0,0.03), 0 8px 24px rgba(123,31,46,0.07), 0 24px 56px rgba(123,31,46,0.05)',
        'float-lg': '0 4px 8px rgba(0,0,0,0.04), 0 16px 40px rgba(123,31,46,0.12), 0 40px 80px rgba(123,31,46,0.09)',
        'featured': '0 4px 8px rgba(0,0,0,0.08), 0 20px 48px rgba(92,16,24,0.35), 0 48px 96px rgba(92,16,24,0.20)',
        'featured-hover': '0 8px 16px rgba(0,0,0,0.10), 0 28px 60px rgba(92,16,24,0.42), 0 56px 100px rgba(92,16,24,0.25)',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
}
