import './debug.scss'
import './fonts.scss'
import './main.scss'
import './defaults.scss'
import '@iconscout/unicons/css/line.css'
import 'tippy.js/dist/tippy.css'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { injectGlobal } from 'vue3-styled-components'
import tokens from './tokens'

const { spacing, colors } = tokens
// eslint-disable-next-line no-unused-expressions
injectGlobal`
  * {
    &::-webkit-scrollbar {
      width: ${spacing['5']};
    }

    &::-webkit-scrollbar-thumb {
      border-left: ${spacing['3']} solid rgba(0, 0, 0, 0);
      background-clip: padding-box;
      background-color: ${colors.gray['100']};

      &:hover {
        background-color: ${colors.gray['90']};
      }

      &:active {
        background-color: ${colors.gray['70']};
      }
    }
  }
`
