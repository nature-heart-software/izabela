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
  }
}