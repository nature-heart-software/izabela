import '@/styles'
import { themes } from '@/themes'
import { ThemeProvider } from 'vue3-styled-components'

export const parameters = {
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
}

export const decorators = [
  (story) => ({
    components: { story, ThemeProvider },
    setup() {
      return { theme: themes.get('dark') };
    },
    template: `
      <ThemeProvider :theme="theme">
        <story />
      </ThemeProvider>
    `,
  }),
];
