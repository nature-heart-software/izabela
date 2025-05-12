import { tokens } from '@/styles/tokens'
import { darken, lighten } from 'polished'

const { colors } = tokens
const color = colors.gray["30"];
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
  hover: {
    backgroundColor: colors.gray["80"],
  },
  active: {
    backgroundColor: colors.gray["90"],
  },
  focus: {
    boxShadow: colors.gray["80"],
  },
  selected: {
    backgroundColor: colors.gray["70"],
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
      ...buttonColors,
      backgroundColor: "transparent",
      borderColor: "transparent",
    },
    "ghost-alt": {
      ...buttonColors,
      backgroundColor: "transparent",
      borderColor: "transparent",
      selected: {
        boxShadow: colors.gray['80'],
        backgroundColor,
      }
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
      hoverBackgroundColor: colors.gray["80"],
      selectedBackgroundColor: colors.gray["80"],
      activeBackgroundColor: colors.gray["70"],
      disabledColor: colors.gray["50"],
      readonlyColor: colors.gray["50"],
      readonlyDividerColor: colors.gray["70"]
    }
  },
  rangeInput: {
    trackColor: colors.gray["70"],
    thumbColor: colors.gray["10"],
    thumbHoverColor: colors.gray["20"],
    thumbActiveColor: colors.gray["40"],
    thumbFocusBoxShadow: colors.gray["30"],
    thumbFocusBorderColor: colors.gray["20"]
  },
  divider: {
    borderColor,
  },
  text: {
    color: colors.gray["30"],
    captionColor: colors.gray["40"],
    linkUnderlineColor: colors.gray["30"]
  },
  tooltip: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    color: colors.black
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
    backdropColor: colors.gray["10"],
    backdropOpacity: 0.95,
    contentBackgroundColor: backgroundColor
  },
  disabledItemBackground: {
    backdropColor: backgroundColor,
    backdropOpacity: 0.9,
  }
}