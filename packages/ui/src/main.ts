export * from './components'
export { tokens, tailwindTheme } from './styles/tokens'
export { ElLoading as NvLoading } from 'element-plus'
import './styles'

declare module 'vue3-styled-components' {
    export const injectGlobal: any
}
