import styled from 'vue3-styled-components'

export * from './components'
export * from './themes'
export { tokens, tailwindTheme } from './styles/tokens'
export { ElLoading as NvLoading } from 'element-plus'
import './styles'
import { rem } from 'polished'
import {
  disabledItemBackgroundStyle,
  borderRadiusStyleBySize,
} from '@/utils/css-in-js'
import { tokens } from '@/styles/tokens'
export { PORTAL_TARGET } from '@/consts'
const { spacing, boxShadow, borderWidth, transition, borderRadius } = tokens

export const GlobalStyles = styled('div')`
  color: ${({ theme }: any) => theme.text.color};
  * {
    &::-webkit-scrollbar {
      width: ${() => rem(spacing['5'])};
    }

    &::-webkit-scrollbar-thumb {
      border-left: ${() => rem(spacing['3'])} solid rgba(0, 0, 0, 0);
      background-clip: padding-box;
      background-color: ${({ theme }: any) => theme.button.plain.backgroundColor};

      &:hover {
        background-color: ${({ theme }: any) => theme.button.plain.hover.backgroundColor};
      }

      &:active {
        background-color: ${({ theme }: any) => theme.button.plain.active.backgroundColor};
      }
    }
  }

  .el-loading-mask {
    ${({ theme }: any) => disabledItemBackgroundStyle({ theme })}
    .el-loading-spinner {
      .circular {
        .path {
          r: ${() => rem(spacing['3'])}
          stroke: ${({ theme }: any) => theme.text.color}
          stroke-width: ${() => rem(spacing['1'])}
        }
      }
    }
  }

  // tippy
  [data-v-tippy] {
    display: inline-flex;
  }

  [data-animation] {
    transition: ${() => transition.DEFAULT} !important;

    &[data-state='hidden'] {
      opacity: 0;
    }

    &[data-state='visible'] {
      opacity: 1;
    }
  }
  
    [data-theme="tooltip"] {
      box-shadow: ${() => boxShadow.lg} !important;
      border-color: ${({ theme }: any) => theme.tooltip.borderColor} !important;
      border-width: ${() => rem(borderWidth.DEFAULT)};
      color: ${({ theme }: any) => theme.tooltip.color} !important;
      background-color: ${({ theme }: any) => theme.tooltip.backgroundColor} !important;
      padding: ${() => rem(spacing[1])} ${() => rem(spacing[2])};
      ${() => borderRadiusStyleBySize('xs')}
      * {
        color: inherit!important;
      }
    }
  
    #vjt-tooltip {
        background-color: ${({ theme }: any) => theme.button.plain.backgroundColor} !important;
        box-shadow: ${() => boxShadow.DEFAULT};
        color: ${({ theme }: any) => theme.button.plain.color} !important;
        [type="body"] {
          color: ${({ theme }: any) => theme.button.plain.color} !important;
        }
        border-radius: ${() => rem(borderRadius.md)} !important;
        font-size: inherit !important;
        padding: ${() => rem(spacing['5'])} !important;
        display: flex;
        flex-direction: column;
        gap: ${() => rem(spacing['5'])};

        &[data-hidden] {
            display: none !important;
        }
    }

    #vjt-arrow {
        &::before {
            background-color: ${({ theme }: any) => theme.button.plain.backgroundColor} !important;
            box-shadow: ${() => boxShadow.DEFAULT};
        }
    }

    .vjt-highlight {
        outline: ${() => rem(2)} solid ${({ theme }: any) => theme.button.plain.backgroundColor} !important;
        border-radius: inherit !important;
    }
`
declare module 'vue3-styled-components' {
  export const injectGlobal: any
}
