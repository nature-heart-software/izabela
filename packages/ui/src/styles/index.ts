import './fonts.scss'
import './main.scss'
import 'element-plus/lib/components/loading/style/css'

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { injectGlobal } from 'vue3-styled-components'
import { rem } from 'polished'
import { disabledItemBackgroundStyle } from '@/utils/css-in-js'
import { tokens } from './tokens'

const { spacing, colors, transition } = tokens
// eslint-disable-next-line no-unused-expressions
injectGlobal`
  * {
    &::-webkit-scrollbar {
      width: ${rem(spacing['5'])};
    }

    &::-webkit-scrollbar-thumb {
      border-left: ${rem(spacing['3'])} solid rgba(0, 0, 0, 0);
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

  .el-loading-mask {
    ${disabledItemBackgroundStyle()}
    .el-loading-spinner {
      .circular {
        .path {
          r: ${rem(spacing['3'])}
          stroke: ${colors.black}
          stroke-width: ${rem(spacing['1'])}
        }
      }
    }
  }

  // tippy
  [data-v-tippy] {
    display: inline-flex;
  }

  [data-animation] {
    transition: ${transition.DEFAULT} !important;

    &[data-state='hidden'] {
      opacity: 0;
    }

    &[data-state='visible'] {
      opacity: 1;
    }
  }
`
