/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#C5DFF6',
          200: '#94C5F0',
          300: '#62ABE9',
          400: '#3B96E4',
          500: '#165DFF',
          600: '#0052D9',
          700: '#003EB3',
          800: '#002B8C',
          900: '#001A66',
        },
        finance: {
          blue: '#165DFF',
          darkblue: '#0052D9',
          bg: '#F0F5FF',
          card: '#FFFFFF',
          border: '#E5EAF2',
          text: '#303133',
          subtext: '#606266',
          muted: '#909399',
        },
      },
      fontFamily: {
        sans: ['PingFang SC', 'Microsoft YaHei', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
