import { tokens } from '@/styles/tokens'

const { colors } = tokens
const color = colors.gray["20"];
export default {
  button: {
    default: {
      color,
      backgroundColor: colors.gray["90"],
      borderColor: colors.gray["70"],
      hover: {
        backgroundColor: colors.gray["80"],
      },
      active: {
        backgroundColor: colors.gray["60"],
      },
      focus: {
        boxShadow: colors.gray["80"],
      },
      selected: {
        backgroundColor: colors.gray["70"],
      }
    },
    active: {
      color,
      backgroundColor: colors.gray["90"],
      borderColor: colors.gray["20"],
      hover: {
        backgroundColor: colors.gray["80"],
      },
      active: {
        backgroundColor: colors.gray["60"],
      },
      focus: {
        boxShadow: colors.gray["80"],
      },
      selected: {
        backgroundColor: colors.gray["70"],
      }
    },
    plain: {
      color: colors.gray["90"],
      backgroundColor: colors.gray["10"],
      borderColor: colors.gray["10"],
      hover: {
        borderColor: colors.gray["20"],
        backgroundColor: colors.gray["20"],
      },
      active: {
        borderColor: colors.gray["40"],
        backgroundColor: colors.gray["40"],
      },
      focus: {
        boxShadow: colors.gray["30"],
      },
      selected: {
        borderColor: colors.gray["30"],
        backgroundColor: colors.gray["30"],
      }
    },
    ghost: {
      color,
      backgroundColor: "transparent",
      borderColor: "transparent",
      hover: {
        backgroundColor: colors.gray["80"],
      },
      active: {
        backgroundColor: colors.gray["60"],
      },
      focus: {
        boxShadow: colors.gray["80"],
      },
      selected: {
        backgroundColor: colors.gray["70"],
      }
    },
    "ghost-alt": {
      color,
      backgroundColor: "transparent",
      borderColor: "transparent",
      hover: {
        backgroundColor: colors.gray["70"],
      },
      active: {
        backgroundColor: colors.gray["60"],
      },
      focus: {
        boxShadow: colors.gray["80"],
      },
      selected: {
        boxShadow: 'boxShadow.DEFAULT',
        backgroundColor: colors.gray["90"],
      }
    }
  },
  card: {
    backgroundColor: colors.gray["90"]
  },
  alert: {
    info: {
      backgroundColor: colors.white,
      color: colors.black,
    },
    success: {
      backgroundColor: colors.gray["90"],
      color: colors.white,
    },
    warning: {
      backgroundColor: colors.gray["90"],
      color: colors.white,
    },
    error: {
      backgroundColor: colors.gray["90"],
      color: colors.white,
    }
  },
  autocomplete: {
    backgroundColor: colors.gray["90"],
    borderColor: colors.gray["70"]
  },
  input: {
    borderColor: colors.gray["70"],
    color: colors.gray["20"],
    backgroundColor: colors.gray['90'],
    hover: {
      borderColor: colors.gray["60"]
    },
    focus: {
      boxShadow: colors.gray["80"],
      borderColor: colors.gray["60"]
    },
    placeholder: {
      color: colors.gray["50"]
    }
  },
  numberInput: {
    borderColor: colors.gray["70"],
    color: colors.gray["20"],
    backgroundColor: colors.gray['90'],
    hover: {
      borderColor: colors.gray["60"]
    },
    focus: {
      boxShadow: colors.gray["80"],
      borderColor: colors.gray["60"]
    },
    placeholder: {
      color: colors.gray["50"]
    }
  },
  switch: {
    backgroundColor: colors.gray["90"],
    borderColor: colors.gray["70"],
    thumbColor: colors.gray["70"],
    activeThumbColor: colors.gray["10"],
    hover: {
      borderColor: colors.gray["60"]
    },
    focus: {
      boxShadow: colors.gray["80"],
      borderColor: colors.gray["60"]
    }
  },
  tag: {
    backgroundColor: colors.gray["90"],
    borderColor: colors.gray["70"]
  },
  select: {
    borderColor: colors.gray["70"],
    color: colors.gray["20"],
    backgroundColor: colors.gray['90'],
    hover: {
      borderColor: colors.gray["60"]
    },
    focus: {
      boxShadow: colors.gray["80"],
      borderColor: colors.gray["60"]
    },
    placeholder: {
      color: colors.gray["50"]
    },
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
    color: colors.gray["70"]
  },
  text: {
    color: colors.gray["20"],
    captionColor: colors.gray["40"],
    linkUnderlineColor: colors.gray["30"]
  },
  tooltip: {
    backgroundColor: colors.white,
    borderColor: colors.white,
    color: colors.black
  },
  popover: {
    backgroundColor: colors.gray["90"],
    borderColor: colors.gray["70"]
  },
  contextMenu: {
    backgroundColor: colors.gray["90"],
    borderColor: colors.gray["70"]
  },
  dialog: {
    backdropColor: colors.gray["10"],
    backdropOpacity: 0.95,
    contentBackgroundColor: colors.gray["90"]
  },
  disabledItemBackground: {
    backdropColor: colors.gray["90"],
    backdropOpacity: 0.9,
  }
}