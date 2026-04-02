/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        gh: {
          bg:      '#0d1117',
          surface: '#161b22',
          card:    '#1c2128',
          border:  '#30363d',
          text:    '#e6edf3',
          muted:   '#8b949e',
          green:   '#3fb950',
          blue:    '#58a6ff',
          amber:   '#d29922',
          red:     '#f85149',
          purple:  '#bc8cff',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
