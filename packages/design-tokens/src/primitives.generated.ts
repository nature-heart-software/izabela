/**
 * Primitive values and names authored in the shared variable collections.
 * @example
 * ```ts
 * const cornerRadius = tokens.radius.md
 * ```
 */
export const tokens = {
  "spacing": {
    1: 2,
    2: 4,
    3: 8,
    4: 12,
    5: 16,
    6: 24,
    7: 32,
    8: 40,
    9: 48,
    10: 64,
    11: 80,
    12: 96,
    13: 112,
    14: 128,
    15: 144,
    16: 160,
    "zero": 0
  },
  "radius": {
    0: 0,
    2: 2,
    "xs": 4,
    "sm": 6,
    "md": 8
  },
  "border": {
    "default": 1,
    "active": 2,
    "lg": 4
  },
  "focus": {
    "spread": 4
  },
  "fontSize": {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 24,
    6: 28,
    7: 32,
    8: 36,
    9: 42,
    10: 48,
    11: 54,
    12: 60,
    13: 68,
    14: 76,
    15: 84,
    16: 92
  },
  "lineHeight": {
    "default": 1.399999976158142
  },
  "letterSpacing": {
    "default": 0.3199999928474426
  },
  "shadow": {
    "offsetY": 2,
    "blur": 1.0080000162124634,
    "spread": 0
  },
  "motion": {
    "visibleOpacity": 1,
    "hiddenOpacity": 0
  },
  "fontFamily": {
    "sans": "Nunito"
  },
  "gap": {
    3: 3,
    5: 5,
    6: 6,
    7: 7,
    10: 10,
    14: 14,
    20: 20,
    50: 50
  }
} as const
