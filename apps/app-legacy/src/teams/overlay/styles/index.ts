import { injectGlobal } from 'vue3-styled-components'

import { tokens } from '@packages/ui'
import { rem } from 'polished'

const { colors, borderRadius, spacing } = tokens

// eslint-disable-next-line no-unused-expressions
injectGlobal`
  #vjt-tooltip {
    background-color: ${colors.black} !important;
    color: inherit !important;
    border-radius: ${rem(borderRadius.md)} !important;
    font-size: inherit !important;
    padding: ${rem(spacing['5'])} !important;
    display: flex;
    flex-direction: column;
    gap: ${rem(spacing['5'])};

    &[data-hidden] {
      display: none !important;
    }
  }

  #vjt-arrow {
    &::before {
      background-color: ${colors.black} !important;
    }
  }

  .vjt-highlight {
    outline: ${rem(2)} solid ${colors.black} !important;
    border-radius: inherit !important;
  }
`
