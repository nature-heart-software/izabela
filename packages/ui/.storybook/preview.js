import '@/styles'
import { resolveTheme, themeOptions } from '@/themes'
import { GlobalStyles, ThemeProvider } from '@/main'
import { shallowRef } from 'vue'

export const parameters = {
  options: { storySort: { method: 'configure' } },
  controls: {
    matchers: { color: /(background|color)$/i, date: /Date$/ },
  },
}

export const globalTypes = {
  theme: {
    name: 'Theme',
    description: 'Application theme',
    defaultValue: 'dark',
    toolbar: {
      icon: 'paintbrush',
      items: themeOptions.map(({ label, value }) => ({ title: label, value })),
      dynamicTitle: true,
    },
  },
}

const selectedTheme = shallowRef()

export const decorators = [
  (story, context) => {
    selectedTheme.value = resolveTheme(context.globals.theme ?? 'dark')
    return {
      components: { story, GlobalStyles, ThemeProvider },
      setup() {
        return { theme: selectedTheme }
      },
      template:
        '<ThemeProvider :theme="theme"><GlobalStyles><story /></GlobalStyles></ThemeProvider>',
    }
  },
]
