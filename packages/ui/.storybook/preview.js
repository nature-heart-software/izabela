import '@/styles'
import { themes } from '@/themes'
import { GlobalStyles } from '@/main'
import { provide } from 'vue'

export const parameters = {
  options: { storySort: { method: 'configure' } },
  controls: {
    matchers: { color: /(background|color)$/i, date: /Date$/ },
  },
}

export const decorators = [
  (story) => ({
    components: { story, GlobalStyles },
    setup() {
      provide('theme', themes.get('dark'))
    },
    template: '<GlobalStyles><story /></GlobalStyles>',
  }),
]
