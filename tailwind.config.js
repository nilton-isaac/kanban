/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        orbitron: ['Orbitron', 'sans-serif'],
        mono: ['"Share Tech Mono"', 'monospace'],
      },
      colors: {
        cyber: {
          bg: '#050510',
          panel: 'rgba(10,15,30,0.85)',
          cyan: '#00f3ff',
          pink: '#ff00ff',
          yellow: '#fcee0a',
          green: '#00ff88',
          orange: '#ff6600',
          purple: '#9b00ff',
        },
      },
      animation: {
        'glitch': 'glitch 2.5s infinite linear alternate-reverse',
        'glitch2': 'glitch2 3s infinite linear alternate-reverse',
        'pulse-cyan': 'pulse-cyan 2s infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        glitch: {
          '0%':   { clipPath: 'inset(10px 0 80px 0)' },
          '20%':  { clipPath: 'inset(60px 0 20px 0)' },
          '40%':  { clipPath: 'inset(30px 0 50px 0)' },
          '60%':  { clipPath: 'inset(70px 0 10px 0)' },
          '80%':  { clipPath: 'inset(5px 0 85px 0)' },
          '100%': { clipPath: 'inset(90px 0 5px 0)' },
        },
        glitch2: {
          '0%':   { clipPath: 'inset(50px 0 40px 0)' },
          '25%':  { clipPath: 'inset(15px 0 75px 0)' },
          '50%':  { clipPath: 'inset(80px 0 10px 0)' },
          '75%':  { clipPath: 'inset(35px 0 55px 0)' },
          '100%': { clipPath: 'inset(5px 0 85px 0)' },
        },
        'pulse-cyan': {
          '0%, 100%': { boxShadow: '0 0 5px #00f3ff, 0 0 10px #00f3ff' },
          '50%': { boxShadow: '0 0 20px #00f3ff, 0 0 40px #00f3ff' },
        },
      },
    },
  },
  plugins: [],
}
