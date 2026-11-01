import { tokens } from '@/styles/tokens'

const { colors } = tokens
const color = colors.gray['80']
const colorAlt = colors.gray['60']
const backgroundColor = colors.white
const borderColor = colors.gray['20']
const inputColors = {
  borderColor,
  color,
  backgroundColor,
  hover: {
    borderColor: colors.gray['30'],
  },
  focus: {
    boxShadow: colors.gray['10'],
    borderColor: colors.gray['30'],
  },
  placeholder: {
    color: colors.gray['40'],
  },
}

const buttonColors = {
  color,
  backgroundColor,
  borderColor,
  disabled: {
    backgroundColor: colors.gray['40'],
  },
  hover: {
    backgroundColor: colors.gray['10'],
  },
  selected: {
    backgroundColor: colors.gray['20'],
  },
  active: {
    backgroundColor: colors.gray['30'],
  },
  focus: {
    boxShadow: colors.gray['10'],
  },
  readonly: {
    color: colors.gray['40'],
    borderColor: colors.gray['20'],
  },
}

const buttonGhostColors = {
  ...buttonColors,
  backgroundColor: 'transparent',
  borderColor: 'transparent',
}

const buttonGhostAltColors = {
  ...buttonGhostColors,
  selected: {
    boxShadow: colors.gray['10'],
    backgroundColor: colors.gray['0'],
  },
}

const buttonPlainColors = {
  color: colors.white,
  backgroundColor: colors.gray['100'],
  borderColor: colors.gray['100'],
  hover: {
    borderColor: colors.gray['90'],
    backgroundColor: colors.gray['90'],
  },
  active: {
    borderColor: colors.gray['70'],
    backgroundColor: colors.gray['70'],
  },
  focus: {
    boxShadow: colors.gray['70'],
  },
  selected: {
    borderColor: colors.gray['80'],
    backgroundColor: colors.gray['80'],
  },
}

export default {
  button: {
    default: {
      ...buttonColors,
    },
    active: {
      ...buttonColors,
      borderColor: buttonPlainColors.borderColor,
    },
    ghost: {
      ...buttonGhostColors,
    },
    'ghost-alt': {
      ...buttonGhostAltColors,
    },
    plain: {
      ...buttonPlainColors,
    },
  },
  card: {
    backgroundColor,
    transparent: {
      backdropColor: colors.gray['10'],
      backdropOpacity: 0.95,
    },
  },
  alert: {
    info: {
      backgroundColor: colors.black,
      color: colors.white,
    },
    success: {
      backgroundColor,
      color: colors.black,
    },
    warning: {
      backgroundColor,
      color: colors.black,
    },
    error: {
      backgroundColor,
      color: colors.black,
    },
  },
  autocomplete: {
    backgroundColor,
    borderColor,
  },
  input: {
    ...inputColors,
  },
  numberInput: {
    ...inputColors,
  },
  switch: {
    backgroundColor,
    borderColor,
    thumbColor: colors.gray['20'],
    activeThumbColor: buttonPlainColors.backgroundColor,
    hover: {
      borderColor: inputColors.hover.borderColor,
    },
    focus: {
      boxShadow: inputColors.focus.boxShadow,
      borderColor: inputColors.focus.borderColor,
    },
  },
  tag: {
    backgroundColor,
    borderColor,
  },
  select: {
    ...inputColors,
    option: {
      ...buttonColors,
    },
  },
  rangeInput: {
    trackColor: borderColor,
    thumbColor: buttonPlainColors.backgroundColor,
    thumbHoverColor: buttonPlainColors.hover.backgroundColor,
    thumbActiveColor: buttonPlainColors.active.backgroundColor,
    thumbFocusBoxShadow: colors.gray['70'],
    thumbFocusBorderColor: colors.gray['90'],
  },
  divider: {
    borderColor,
  },
  text: {
    color,
    captionColor: colorAlt,
    linkUnderlineColor: color,
  },
  tooltip: {
    backgroundColor: buttonPlainColors.backgroundColor,
    borderColor: buttonPlainColors.backgroundColor,
    color: buttonPlainColors.color,
  },
  popover: {
    backgroundColor,
    borderColor,
  },
  contextMenu: {
    backgroundColor,
    borderColor,
  },
  dialog: {
    backdropColor: colors.gray['100'],
    backdropOpacity: 0.95,
    contentBackgroundColor: backgroundColor,
  },
  disabledItemBackground: {
    backdropColor: backgroundColor,
    backdropOpacity: 0.9,
  },
}
