import { tokens } from '@/styles/tokens'
import { darken, lighten } from 'polished'

const { colors } = tokens
const color = colors.gray["30"];
const colorAlt = colors.gray["40"];
const backgroundColor = darken(.0675)(colors.gray['80'])
const borderColor = colors.gray["80"]
const inputColors = {
  borderColor,
  color,
  backgroundColor,
  hover: {
    borderColor: colors.gray["70"]
  },
  focus: {
    boxShadow: colors.gray["80"],
    borderColor: colors.gray["70"]
  },
  placeholder: {
    color: colors.gray["60"]
  }
}

const buttonColors = {
  color,
  backgroundColor,
  borderColor,
  disabled: {
    backgroundColor: colors.gray["50"]
  },
  hover: {
    backgroundColor: colors.gray["80"],
  },
  selected: {
    backgroundColor: darken(.0675)(colors.gray["70"]),
  },
  active: {
    backgroundColor: colors.gray["90"],
  },
  focus: {
    boxShadow: colors.gray["80"],
  },
  readonly: {
    color: colors.gray["50"],
    borderColor: colors.gray["70"],
  },
}

const buttonGhostColors = {
  ...buttonColors,
  backgroundColor: "transparent",
  borderColor: "transparent",
}

const buttonGhostAltColors = {
  ...buttonGhostColors,
  selected: {
    boxShadow: colors.gray['80'],
    backgroundColor,
  }
}

const buttonPlainColors = {
    color: colors.gray["80"],
    backgroundColor: lighten(.05)(colors.gray["50"]),
    borderColor: lighten(.05)(colors.gray["50"]),
    hover: {
      borderColor: colors.gray["40"],
      backgroundColor: colors.gray["40"],
    },
    active: {
      borderColor: colors.gray["50"],
      backgroundColor: colors.gray["50"],
    },
    focus: {
      boxShadow: lighten(.05)(colors.gray["50"]),
    },
    selected: {
      borderColor: lighten(.05)(colors.gray["50"]),
      backgroundColor: lighten(.05)(colors.gray["50"]),
    }
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
    "ghost-alt": {
      ...buttonGhostAltColors,
    },
    plain: {
      ...buttonPlainColors
    }
  },
  card: {
   backgroundColor,
    transparent: {
      backdropColor: colors.gray["90"],
      backdropOpacity: 0.95,
    },
  },
  alert: {
    info: {
      backgroundColor: colors.white,
      color: colors.black,
    },
    success: {
     backgroundColor,
      color: colors.white,
    },
    warning: {
     backgroundColor,
      color: colors.white,
    },
    error: {
     backgroundColor,
      color: colors.white,
    }
  },
  autocomplete: {
    backgroundColor,
    borderColor
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
    thumbColor: colors.gray["70"],
    activeThumbColor: buttonPlainColors.backgroundColor,
    hover: {
      borderColor: inputColors.hover.borderColor,
    },
    focus: {
      boxShadow: inputColors.focus.boxShadow,
      borderColor: inputColors.focus.borderColor,
    }
  },
  tag: {
   backgroundColor,
    borderColor
  },
  select: {
    ...inputColors,
    option: {
      ...buttonColors,
    }
  },
  rangeInput: {
    trackColor: borderColor,
    thumbColor: buttonPlainColors.backgroundColor,
    thumbHoverColor: buttonPlainColors.hover.backgroundColor,
    thumbActiveColor: buttonPlainColors.active.backgroundColor,
    thumbFocusBoxShadow: colors.gray["30"],
    thumbFocusBorderColor: colors.gray["20"]
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
    color: buttonPlainColors.color
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
    backdropColor: colors.gray["90"],
    backdropOpacity: 0.95,
    contentBackgroundColor: backgroundColor
  },
  disabledItemBackground: {
    backdropColor: backgroundColor,
    backdropOpacity: 0.9,
  }
}