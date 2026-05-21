export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Tajawal', 'Arial', 'sans-serif']
      },
      colors: {
        brand: {
          navy: '#0f2742',
          blue: '#16456f',
          green: '#16815f',
          mint: '#e7f6ef',
          soft: '#f5f7fa'
        }
      },
      boxShadow: {
        soft: '0 16px 40px rgba(15, 39, 66, 0.08)'
      }
    }
  },
  plugins: []
};
