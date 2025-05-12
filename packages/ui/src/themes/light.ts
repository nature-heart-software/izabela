import { tokens } from '@/styles/tokens'

const { colors } = tokens
const color = colors.gray["80"];
const backgroundColor = colors.white
const borderColor = colors.gray["20"]
const inputColors = {
  borderColor,
  color,
  backgroundColor,
  hover: {
    borderColor: colors.gray["30"]
  },
  focus: {
    boxShadow: colors.gray["10"],
    borderColor: colors.gray["30"]
  },
  placeholder: {
    color: colors.gray["40"]
  }
}

const buttonColors = {
  color,
  backgroundColor,
  borderColor,
  hover: {
    backgroundColor: colors.gray["10"],
  },
  active: {
    backgroundColor: colors.gray["30"],
  },
  focus: {
    boxShadow: colors.gray["10"],
  },
  selected: {
    backgroundColor: colors.gray["20"],
  }
}

const buttonPlainColors = {
    color: colors.white,
    backgroundColor: colors.gray["100"],
    borderColor: colors.gray["100"],
    hover: {
      borderColor: colors.gray["90"],
      backgroundColor: colors.gray["90"],
    },
    active: {
      borderColor: colors.gray["70"],
      backgroundColor: colors.gray["70"],
    },
    focus: {
      boxShadow: colors.gray["70"],
    },
    selected: {
      borderColor: colors.gray["80"],
      backgroundColor: colors.gray["80"],
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
        boxShadow: colors.gray['10'],
        backgroundColor: colors.gray["0"],
      }
    },
    plain: {
      ...buttonPlainColors
    },
  },
  card: {
    backgroundColor,
    transparent: {
      backdropColor: colors.gray["10"],
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
    }
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
    thumbColor: colors.gray["20"],
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
    borderColor,
  },
  select: {
    ...inputColors,
    option: {
      hoverBackgroundColor: colors.gray["10"],
      selectedBackgroundColor: colors.gray["10"],
      activeBackgroundColor: colors.gray["20"],
      disabledColor: colors.gray["40"],
      readonlyColor: colors.gray["40"],
      readonlyDividerColor: colors.gray["20"]
    }
  },
  rangeInput: {
    trackColor: colors.gray["20"],
    thumbColor: colors.gray["100"],
    thumbHoverColor: colors.gray["90"],
    thumbActiveColor: colors.gray["70"],
    thumbFocusBoxShadow: colors.gray["70"],
    thumbFocusBorderColor: colors.gray["90"]
  },
  divider: {
    borderColor,
  },
  text: {
    color: colors.gray['90'],
    captionColor: colors.gray["60"],
    linkUnderlineColor: colors.gray["80"]
  },
  tooltip: {
    backgroundColor: colors.black,
    borderColor: colors.black,
    color: colors.white
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
    backdropColor: colors.gray["100"],
    backdropOpacity: 0.95,
    contentBackgroundColor: backgroundColor
  },
  disabledItemBackground: {
    backdropColor: backgroundColor,
    backdropOpacity: 0.9,
  }
}