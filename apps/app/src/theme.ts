// import { TailwindConfig } from 'tailwindcss/tailwind-config'

const theme = {
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
  
  colors: {
    white: '#ffffff',
    black: '#0E0E2C',
    gray: {
      100: '#0E0E2C',
      90: '#2B2B2C',
      80: '#444444',
      /* Generated with: https://coolors.co/gradient-palette/444444-DCDCDC?number=6 */
      70: '#626262',
      60: '#818181',
      50: '#9F9F9F',
      40: '#BEBEBE',
      /* --------- */
      30: '#DCDCDC',
      20: '#EBEBEB',
      10: '#F9F9FC',
      0: '#ffffff',
    },
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
  },
  borderRadius: {
    xs: '.25rem',
    sm: '.375rem',
    md: '.5rem',
    DEFAULT: '.5rem',
  },
  borderWidth: {
    DEFAULT: '.063rem',
    lg: '.25rem',
  },
  boxShadow: {
    DEFAULT: '0px 2px 1px rgba(0, 0, 0, 0.05)',
  }
}

module.exports = theme
