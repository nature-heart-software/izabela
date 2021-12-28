const extend = {
  fontFamily: {
    sans: [
      'Nunito',
      'system-ui',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      '"Noto Sans"',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
      '"Noto Color Emoji"',
    ],
    serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
    mono: ['Menlo', 'Monaco', 'Consolas', '"Liberation Mono"', '"Courier New"', 'monospace'],
  },
  // Generated with: https://coolors.co/gradient-palette/ffffff-0e0e2c?number=11
  colors: {
    white: '#ffffff',
    black: '#0E0E2C',
    gray: {
      100: '#0E0E2C',
      90: '#262641',
      80: '#3E3E56',
      70: '#56566B',
      60: '#6E6E80',
      50: '#878796',
      40: '#9F9FAB',
      30: '#B7B7C0',
      20: '#CFCFD5',
      10: '#E7E7EA',
      0: '#ffffff'
    }
  },
  // Follows: https://www.carbondesignsystem.com/guidelines/spacing/overview/
  space: {
    1: '.125rem',
    2: '.25rem',
    3: '.5rem',
    4: '.75rem',
    5: '1rem',
    6: '1.5rem',
    7: '2rem',
    8: '2.5rem',
    9: '3rem',
    10: '4rem',
    11: '5rem',
    12: '6rem',
    13: '10rem',
  },
  // Follows: https://www.carbondesignsystem.com/guidelines/typography/overview/
  fontSize: {
    1: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    2: ['0.875rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    3: ['1rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    4: ['1.125rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    5: ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    6: ['1.75rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    7: ['2rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    8: ['2.25rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    9: ['2.625rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    10: ['3rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    11: ['3.375rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    12: ['3.75rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    13: ['4.25rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    14: ['4.75rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    15: ['5.25rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
    16: ['5.75rem', { lineHeight: '1.4', letterSpacing: '0.02rem' }],
  }
}
module.exports = {
  content: [
    './src/**/*.{vue,html,js,scss}'
  ],
  theme: {
    extend: {
      ...extend,
    },
  },
  plugins: [],
}
