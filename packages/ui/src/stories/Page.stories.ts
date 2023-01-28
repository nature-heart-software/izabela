import type { Meta, StoryObj } from '@storybook/vue3'
import { userEvent, within } from '@storybook/testing-library'
import MyPage from './Page.vue'

const meta: Meta<typeof MyPage> = {
  title: 'Example/Page2',
  component: MyPage,
  render: () => ({
    components: { MyPage },
    template: '<my-page />',
  }),
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/7.0/vue/configure/story-layout
    layout: 'fullscreen',
  },
  // This component will have an automatically generated docsPage entry: https://storybook.js.org/docs/7.0/vue/writing-docs/docs-page
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof MyPage>

// More on interaction testing: https://storybook.js.org/docs/7.0/vue/writing-tests/interaction-testing
export const LoggedIn: Story = {
  play: async ({ canvasElement }: any) => {
    const canvas = within(canvasElement)
    const loginButton = await canvas.getByRole('button', {
      name: /Log in/i,
    })
    await userEvent.click(loginButton)
  },
}

export const LoggedOut: Story = {}
