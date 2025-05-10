import { tokens } from '@/styles/tokens'

const { colors } = tokens

export default {
  button: {
    default: {
      backgroundColor: colors.white,
      borderColor: colors.gray["20"],
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
    },
    active: {
      backgroundColor: colors.white,
      borderColor: colors.gray["100"],
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
    },
    plain: {
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
    },
    ghost: {
      backgroundColor: "transparent",
      borderColor: "transparent",
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
    },
    "ghost-alt": {
      backgroundColor: "transparent",
      borderColor: "transparent",
      hover: {
        backgroundColor: colors.gray["20"],
      },
      active: {
        backgroundColor: colors.gray["30"],
      },
      focus: {
        boxShadow: colors.gray["10"],
      },
      selected: {
        boxShadow: 'boxShadow.DEFAULT',
        backgroundColor: colors.gray["0"],
      }
    }
  },
  card: {
    backgroundColor: colors.white
  },
  alert: {
    info: {
      backgroundColor: colors.black,
      color: colors.white,
    },
    success: {
      backgroundColor: colors.white,
      color: colors.black,
    },
    warning: {
      backgroundColor: colors.white,
      color: colors.black,
    },
    error: {
      backgroundColor: colors.white,
      color: colors.black,
    }
  },
  autocomplete: {
    backgroundColor: colors.white,
    borderColor: colors.gray["20"]
  },
  input: {
    borderColor: colors.gray["20"],
    color: colors.gray["90"],
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
  },
  numberInput: {
    borderColor: colors.gray["20"],
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
  },
  switch: {
    backgroundColor: colors.white,
    borderColor: colors.gray["20"],
    thumbColor: colors.gray["20"],
    activeThumbColor: colors.gray["100"],
    hover: {
      borderColor: colors.gray["30"]
    },
    focus: {
      boxShadow: colors.gray["10"],
      borderColor: colors.gray["30"]
    }
  },
  tag: {
    backgroundColor: colors.white,
    borderColor: colors.gray["20"]
  },
  select: {
    borderColor: colors.gray["20"],
    hover: {
      borderColor: colors.gray["30"]
    },
    focus: {
      boxShadow: colors.gray["10"],
      borderColor: colors.gray["30"]
    },
    placeholder: {
      color: colors.gray["40"]
    },
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
    color: colors.gray["20"]
  },
  text: {
    color: "inherit",
    captionColor: colors.gray["60"],
    linkUnderlineColor: colors.gray["80"]
  },
  tooltip: {
    backgroundColor: colors.black,
    borderColor: colors.black,
    color: colors.white
  },
  popover: {
    backgroundColor: colors.white,
    borderColor: colors.gray["20"]
  },
  contextMenu: {
    backgroundColor: colors.white,
    borderColor: colors.gray["20"]
  },
  dialog: {
    backdropColor: colors.gray["100"],
    backdropOpacity: 0.95,
    contentBackgroundColor: colors.white
  }
}