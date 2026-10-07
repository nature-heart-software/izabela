# Izabela Design System

## Scope and sources

This is a reference for the implementation in this checkout, not a proposed design or a browser-independent rendering guarantee. The canonical values are in [`packages/design-tokens/src/main.ts`](packages/design-tokens/src/main.ts). The UI re-exports them from [`styles/tokens.ts`](packages/ui/src/styles/tokens.ts); [`light.ts`](packages/ui/src/themes/light.ts), [`dark.ts`](packages/ui/src/themes/dark.ts), and [`css-in-js.ts`](packages/ui/src/utils/css-in-js.ts) provide semantic colors and geometry helpers.

The exact-value tables below preserve exported JSON values, including color casing, aliases, font tuples, complete font-family arrays, motion leaves, and derived `polished` outputs. A theme key existing does **not** mean a component consumes it. Component READMEs explain selectors, precedence, inherited values, vendor boundaries, and source-proven quirks. Use those contracts rather than applying one control's sizing or state rules to every component.

Numeric spacing, radius and border-width primitives are pixel values. Canonical font tuples are `[pixelSize, {lineHeight, letterSpacing}]`, with a unitless line-height multiplier and pixel letter spacing. Tailwind converts dimensions and letter spacing to rem with `polished.rem`'s default base of 16. CSS rem lengths still scale with the effective root font size; a px equivalent in component docs assumes a 16px root. The shadow is preserved as rem, not rounded to an integer px substitute. Motion `duration` values are milliseconds. The exported `transition.DEFAULT` is a CSS transition string, not a rule applied to every descendant.

## Canonical token inventory

These are every canonical primitive entry; arrays are retained as single entries so complete font stacks and typography tuples are visible.

| Token                                       | Exact exported JSON value                                                                                                                                                                                                                 |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tokens.fontFamily.sans`                    | `["Nunito","system-ui","-apple-system","BlinkMacSystemFont","\"Segoe UI\"","Roboto","\"Helvetica Neue\"","Arial","\"Noto Sans\"","sans-serif","\"Apple Color Emoji\"","\"Segoe UI Emoji\"","\"Segoe UI Symbol\"","\"Noto Color Emoji\""]` |
| `tokens.fontFamily.serif`                   | `["Georgia","Cambria","\"Times New Roman\"","Times","serif"]`                                                                                                                                                                             |
| `tokens.fontFamily.mono`                    | `["Menlo","Monaco","Consolas","\"Liberation Mono\"","\"Courier New\"","monospace"]`                                                                                                                                                       |
| `tokens.colors.white`                       | `"#ffffff"`                                                                                                                                                                                                                               |
| `tokens.colors.black`                       | `"#0E0E2C"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.0`                      | `"#ffffff"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.10`                     | `"#F9F9FC"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.20`                     | `"#EBEBEB"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.30`                     | `"#DCDCDC"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.40`                     | `"#BEBEBE"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.50`                     | `"#9F9F9F"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.60`                     | `"#818181"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.70`                     | `"#626262"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.80`                     | `"#444444"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.90`                     | `"#2B2B2C"`                                                                                                                                                                                                                               |
| `tokens.colors.gray.100`                    | `"#0E0E2C"`                                                                                                                                                                                                                               |
| `tokens.spacing.1`                          | `2`                                                                                                                                                                                                                                       |
| `tokens.spacing.2`                          | `4`                                                                                                                                                                                                                                       |
| `tokens.spacing.3`                          | `8`                                                                                                                                                                                                                                       |
| `tokens.spacing.4`                          | `12`                                                                                                                                                                                                                                      |
| `tokens.spacing.5`                          | `16`                                                                                                                                                                                                                                      |
| `tokens.spacing.6`                          | `24`                                                                                                                                                                                                                                      |
| `tokens.spacing.7`                          | `32`                                                                                                                                                                                                                                      |
| `tokens.spacing.8`                          | `40`                                                                                                                                                                                                                                      |
| `tokens.spacing.9`                          | `48`                                                                                                                                                                                                                                      |
| `tokens.spacing.10`                         | `64`                                                                                                                                                                                                                                      |
| `tokens.spacing.11`                         | `80`                                                                                                                                                                                                                                      |
| `tokens.spacing.12`                         | `96`                                                                                                                                                                                                                                      |
| `tokens.spacing.13`                         | `112`                                                                                                                                                                                                                                     |
| `tokens.spacing.14`                         | `128`                                                                                                                                                                                                                                     |
| `tokens.spacing.15`                         | `144`                                                                                                                                                                                                                                     |
| `tokens.spacing.16`                         | `160`                                                                                                                                                                                                                                     |
| `tokens.fontSize.1`                         | `[12,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.2`                         | `[14,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.3`                         | `[16,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.4`                         | `[18,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.5`                         | `[24,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.6`                         | `[28,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.7`                         | `[32,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.8`                         | `[36,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.9`                         | `[42,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.10`                        | `[48,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.11`                        | `[54,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.12`                        | `[60,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.13`                        | `[68,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.14`                        | `[76,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.15`                        | `[84,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.fontSize.16`                        | `[92,{"lineHeight":1.4,"letterSpacing":0.32}]`                                                                                                                                                                                            |
| `tokens.borderRadius.xs`                    | `4`                                                                                                                                                                                                                                       |
| `tokens.borderRadius.sm`                    | `6`                                                                                                                                                                                                                                       |
| `tokens.borderRadius.md`                    | `8`                                                                                                                                                                                                                                       |
| `tokens.borderRadius.DEFAULT`               | `8`                                                                                                                                                                                                                                       |
| `tokens.borderWidth.DEFAULT`                | `1`                                                                                                                                                                                                                                       |
| `tokens.borderWidth.lg`                     | `4`                                                                                                                                                                                                                                       |
| `tokens.boxShadow.DEFAULT`                  | `"0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)"`                                                                                                                                                                                               |
| `tokens.boxShadow.lg`                       | `"0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)"`                                                                                                                                                                                               |
| `tokens.transition.DEFAULT`                 | `"all .3s"`                                                                                                                                                                                                                               |
| `tokens.motion.visible.opacity`             | `1`                                                                                                                                                                                                                                       |
| `tokens.motion.visible.transition.duration` | `300`                                                                                                                                                                                                                                     |
| `tokens.motion.hidden.opacity`              | `0`                                                                                                                                                                                                                                       |
| `tokens.motion.hidden.transition.duration`  | `300`                                                                                                                                                                                                                                     |

## Derived Tailwind inventory

`tailwindTheme` spreads `tokens`, replacing spacing, radius, border width and font-size tuples with their rem forms. The table describes the exported object; it does not claim Tailwind generates utilities for every arbitrary key (for example `motion`). Both [`packages/ui/tailwind.config.cjs`](packages/ui/tailwind.config.cjs) and [`apps/app/tailwind.config.js`](apps/app/tailwind.config.js) consume the token package.

| Token                                              | Exact exported JSON value                                                                                                                                                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tailwindTheme.fontFamily.sans`                    | `["Nunito","system-ui","-apple-system","BlinkMacSystemFont","\"Segoe UI\"","Roboto","\"Helvetica Neue\"","Arial","\"Noto Sans\"","sans-serif","\"Apple Color Emoji\"","\"Segoe UI Emoji\"","\"Segoe UI Symbol\"","\"Noto Color Emoji\""]` |
| `tailwindTheme.fontFamily.serif`                   | `["Georgia","Cambria","\"Times New Roman\"","Times","serif"]`                                                                                                                                                                             |
| `tailwindTheme.fontFamily.mono`                    | `["Menlo","Monaco","Consolas","\"Liberation Mono\"","\"Courier New\"","monospace"]`                                                                                                                                                       |
| `tailwindTheme.colors.white`                       | `"#ffffff"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.black`                       | `"#0E0E2C"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.0`                      | `"#ffffff"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.10`                     | `"#F9F9FC"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.20`                     | `"#EBEBEB"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.30`                     | `"#DCDCDC"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.40`                     | `"#BEBEBE"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.50`                     | `"#9F9F9F"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.60`                     | `"#818181"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.70`                     | `"#626262"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.80`                     | `"#444444"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.90`                     | `"#2B2B2C"`                                                                                                                                                                                                                               |
| `tailwindTheme.colors.gray.100`                    | `"#0E0E2C"`                                                                                                                                                                                                                               |
| `tailwindTheme.spacing.1`                          | `"0.125rem"`                                                                                                                                                                                                                              |
| `tailwindTheme.spacing.2`                          | `"0.25rem"`                                                                                                                                                                                                                               |
| `tailwindTheme.spacing.3`                          | `"0.5rem"`                                                                                                                                                                                                                                |
| `tailwindTheme.spacing.4`                          | `"0.75rem"`                                                                                                                                                                                                                               |
| `tailwindTheme.spacing.5`                          | `"1rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.6`                          | `"1.5rem"`                                                                                                                                                                                                                                |
| `tailwindTheme.spacing.7`                          | `"2rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.8`                          | `"2.5rem"`                                                                                                                                                                                                                                |
| `tailwindTheme.spacing.9`                          | `"3rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.10`                         | `"4rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.11`                         | `"5rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.12`                         | `"6rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.13`                         | `"7rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.14`                         | `"8rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.15`                         | `"9rem"`                                                                                                                                                                                                                                  |
| `tailwindTheme.spacing.16`                         | `"10rem"`                                                                                                                                                                                                                                 |
| `tailwindTheme.fontSize.1`                         | `["0.75rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.2`                         | `["0.875rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                               |
| `tailwindTheme.fontSize.3`                         | `["1rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                   |
| `tailwindTheme.fontSize.4`                         | `["1.125rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                               |
| `tailwindTheme.fontSize.5`                         | `["1.5rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                 |
| `tailwindTheme.fontSize.6`                         | `["1.75rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.7`                         | `["2rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                   |
| `tailwindTheme.fontSize.8`                         | `["2.25rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.9`                         | `["2.625rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                               |
| `tailwindTheme.fontSize.10`                        | `["3rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                   |
| `tailwindTheme.fontSize.11`                        | `["3.375rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                               |
| `tailwindTheme.fontSize.12`                        | `["3.75rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.13`                        | `["4.25rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.14`                        | `["4.75rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.15`                        | `["5.25rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.fontSize.16`                        | `["5.75rem",{"lineHeight":1.4,"letterSpacing":"0.02rem"}]`                                                                                                                                                                                |
| `tailwindTheme.borderRadius.xs`                    | `"0.25rem"`                                                                                                                                                                                                                               |
| `tailwindTheme.borderRadius.sm`                    | `"0.375rem"`                                                                                                                                                                                                                              |
| `tailwindTheme.borderRadius.md`                    | `"0.5rem"`                                                                                                                                                                                                                                |
| `tailwindTheme.borderRadius.DEFAULT`               | `"0.5rem"`                                                                                                                                                                                                                                |
| `tailwindTheme.borderWidth.DEFAULT`                | `"0.0625rem"`                                                                                                                                                                                                                             |
| `tailwindTheme.borderWidth.lg`                     | `"0.25rem"`                                                                                                                                                                                                                               |
| `tailwindTheme.boxShadow.DEFAULT`                  | `"0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)"`                                                                                                                                                                                               |
| `tailwindTheme.boxShadow.lg`                       | `"0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)"`                                                                                                                                                                                               |
| `tailwindTheme.transition.DEFAULT`                 | `"all .3s"`                                                                                                                                                                                                                               |
| `tailwindTheme.motion.visible.opacity`             | `1`                                                                                                                                                                                                                                       |
| `tailwindTheme.motion.visible.transition.duration` | `300`                                                                                                                                                                                                                                     |
| `tailwindTheme.motion.hidden.opacity`              | `0`                                                                                                                                                                                                                                       |
| `tailwindTheme.motion.hidden.transition.duration`  | `300`                                                                                                                                                                                                                                     |

## Resolved semantic themes

Both modes have the same leaf-key set. Values below are the exact JavaScript output after `polished` evaluation, not approximate swatches. For example `#333` and `#333333` describe the same color, but the table retains the actual returned form. A field called `active` is a state object; `theme.button.active` is a separate named Button variant. Do not conflate them.

| Theme leaf                                        | Light JSON value | Dark JSON value |
| ------------------------------------------------- | ---------------- | --------------- |
| `theme.button.default.color`                      | `"#444444"`      | `"#DCDCDC"`     |
| `theme.button.default.backgroundColor`            | `"#ffffff"`      | `"#333"`        |
| `theme.button.default.borderColor`                | `"#EBEBEB"`      | `"#444444"`     |
| `theme.button.default.disabled.backgroundColor`   | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.default.hover.backgroundColor`      | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.default.selected.backgroundColor`   | `"#EBEBEB"`      | `"#515151"`     |
| `theme.button.default.active.backgroundColor`     | `"#DCDCDC"`      | `"#2B2B2C"`     |
| `theme.button.default.focus.boxShadow`            | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.default.readonly.color`             | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.default.readonly.borderColor`       | `"#EBEBEB"`      | `"#626262"`     |
| `theme.button.active.color`                       | `"#444444"`      | `"#DCDCDC"`     |
| `theme.button.active.backgroundColor`             | `"#ffffff"`      | `"#333"`        |
| `theme.button.active.borderColor`                 | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.button.active.disabled.backgroundColor`    | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.active.hover.backgroundColor`       | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.active.selected.backgroundColor`    | `"#EBEBEB"`      | `"#515151"`     |
| `theme.button.active.active.backgroundColor`      | `"#DCDCDC"`      | `"#2B2B2C"`     |
| `theme.button.active.focus.boxShadow`             | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.active.readonly.color`              | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.active.readonly.borderColor`        | `"#EBEBEB"`      | `"#626262"`     |
| `theme.button.ghost.color`                        | `"#444444"`      | `"#DCDCDC"`     |
| `theme.button.ghost.backgroundColor`              | `"transparent"`  | `"transparent"` |
| `theme.button.ghost.borderColor`                  | `"transparent"`  | `"transparent"` |
| `theme.button.ghost.disabled.backgroundColor`     | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.ghost.hover.backgroundColor`        | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.ghost.selected.backgroundColor`     | `"#EBEBEB"`      | `"#515151"`     |
| `theme.button.ghost.active.backgroundColor`       | `"#DCDCDC"`      | `"#2B2B2C"`     |
| `theme.button.ghost.focus.boxShadow`              | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.ghost.readonly.color`               | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.ghost.readonly.borderColor`         | `"#EBEBEB"`      | `"#626262"`     |
| `theme.button.ghost-alt.color`                    | `"#444444"`      | `"#DCDCDC"`     |
| `theme.button.ghost-alt.backgroundColor`          | `"transparent"`  | `"transparent"` |
| `theme.button.ghost-alt.borderColor`              | `"transparent"`  | `"transparent"` |
| `theme.button.ghost-alt.disabled.backgroundColor` | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.ghost-alt.hover.backgroundColor`    | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.ghost-alt.selected.boxShadow`       | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.ghost-alt.selected.backgroundColor` | `"#ffffff"`      | `"#333"`        |
| `theme.button.ghost-alt.active.backgroundColor`   | `"#DCDCDC"`      | `"#2B2B2C"`     |
| `theme.button.ghost-alt.focus.boxShadow`          | `"#F9F9FC"`      | `"#444444"`     |
| `theme.button.ghost-alt.readonly.color`           | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.button.ghost-alt.readonly.borderColor`     | `"#EBEBEB"`      | `"#626262"`     |
| `theme.button.plain.color`                        | `"#ffffff"`      | `"#444444"`     |
| `theme.button.plain.backgroundColor`              | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.button.plain.borderColor`                  | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.button.plain.hover.borderColor`            | `"#2B2B2C"`      | `"#BEBEBE"`     |
| `theme.button.plain.hover.backgroundColor`        | `"#2B2B2C"`      | `"#BEBEBE"`     |
| `theme.button.plain.active.borderColor`           | `"#626262"`      | `"#9F9F9F"`     |
| `theme.button.plain.active.backgroundColor`       | `"#626262"`      | `"#9F9F9F"`     |
| `theme.button.plain.focus.boxShadow`              | `"#626262"`      | `"#acacac"`     |
| `theme.button.plain.selected.borderColor`         | `"#444444"`      | `"#acacac"`     |
| `theme.button.plain.selected.backgroundColor`     | `"#444444"`      | `"#acacac"`     |
| `theme.card.backgroundColor`                      | `"#ffffff"`      | `"#333"`        |
| `theme.card.transparent.backdropColor`            | `"#F9F9FC"`      | `"#2B2B2C"`     |
| `theme.card.transparent.backdropOpacity`          | `0.95`           | `0.95`          |
| `theme.alert.info.backgroundColor`                | `"#0E0E2C"`      | `"#ffffff"`     |
| `theme.alert.info.color`                          | `"#ffffff"`      | `"#0E0E2C"`     |
| `theme.alert.success.backgroundColor`             | `"#ffffff"`      | `"#333"`        |
| `theme.alert.success.color`                       | `"#0E0E2C"`      | `"#ffffff"`     |
| `theme.alert.warning.backgroundColor`             | `"#ffffff"`      | `"#333"`        |
| `theme.alert.warning.color`                       | `"#0E0E2C"`      | `"#ffffff"`     |
| `theme.alert.error.backgroundColor`               | `"#ffffff"`      | `"#333"`        |
| `theme.alert.error.color`                         | `"#0E0E2C"`      | `"#ffffff"`     |
| `theme.autocomplete.backgroundColor`              | `"#ffffff"`      | `"#333"`        |
| `theme.autocomplete.borderColor`                  | `"#EBEBEB"`      | `"#444444"`     |
| `theme.input.borderColor`                         | `"#EBEBEB"`      | `"#444444"`     |
| `theme.input.color`                               | `"#444444"`      | `"#DCDCDC"`     |
| `theme.input.backgroundColor`                     | `"#ffffff"`      | `"#333"`        |
| `theme.input.hover.borderColor`                   | `"#DCDCDC"`      | `"#626262"`     |
| `theme.input.focus.boxShadow`                     | `"#F9F9FC"`      | `"#444444"`     |
| `theme.input.focus.borderColor`                   | `"#DCDCDC"`      | `"#626262"`     |
| `theme.input.placeholder.color`                   | `"#BEBEBE"`      | `"#818181"`     |
| `theme.numberInput.borderColor`                   | `"#EBEBEB"`      | `"#444444"`     |
| `theme.numberInput.color`                         | `"#444444"`      | `"#DCDCDC"`     |
| `theme.numberInput.backgroundColor`               | `"#ffffff"`      | `"#333"`        |
| `theme.numberInput.hover.borderColor`             | `"#DCDCDC"`      | `"#626262"`     |
| `theme.numberInput.focus.boxShadow`               | `"#F9F9FC"`      | `"#444444"`     |
| `theme.numberInput.focus.borderColor`             | `"#DCDCDC"`      | `"#626262"`     |
| `theme.numberInput.placeholder.color`             | `"#BEBEBE"`      | `"#818181"`     |
| `theme.switch.backgroundColor`                    | `"#ffffff"`      | `"#333"`        |
| `theme.switch.borderColor`                        | `"#EBEBEB"`      | `"#444444"`     |
| `theme.switch.thumbColor`                         | `"#EBEBEB"`      | `"#626262"`     |
| `theme.switch.activeThumbColor`                   | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.switch.hover.borderColor`                  | `"#DCDCDC"`      | `"#626262"`     |
| `theme.switch.focus.boxShadow`                    | `"#F9F9FC"`      | `"#444444"`     |
| `theme.switch.focus.borderColor`                  | `"#DCDCDC"`      | `"#626262"`     |
| `theme.tag.backgroundColor`                       | `"#ffffff"`      | `"#333"`        |
| `theme.tag.borderColor`                           | `"#EBEBEB"`      | `"#444444"`     |
| `theme.select.borderColor`                        | `"#EBEBEB"`      | `"#444444"`     |
| `theme.select.color`                              | `"#444444"`      | `"#DCDCDC"`     |
| `theme.select.backgroundColor`                    | `"#ffffff"`      | `"#333"`        |
| `theme.select.hover.borderColor`                  | `"#DCDCDC"`      | `"#626262"`     |
| `theme.select.focus.boxShadow`                    | `"#F9F9FC"`      | `"#444444"`     |
| `theme.select.focus.borderColor`                  | `"#DCDCDC"`      | `"#626262"`     |
| `theme.select.placeholder.color`                  | `"#BEBEBE"`      | `"#818181"`     |
| `theme.select.option.color`                       | `"#444444"`      | `"#DCDCDC"`     |
| `theme.select.option.backgroundColor`             | `"#ffffff"`      | `"#333"`        |
| `theme.select.option.borderColor`                 | `"#EBEBEB"`      | `"#444444"`     |
| `theme.select.option.disabled.backgroundColor`    | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.select.option.hover.backgroundColor`       | `"#F9F9FC"`      | `"#444444"`     |
| `theme.select.option.selected.backgroundColor`    | `"#EBEBEB"`      | `"#515151"`     |
| `theme.select.option.active.backgroundColor`      | `"#DCDCDC"`      | `"#2B2B2C"`     |
| `theme.select.option.focus.boxShadow`             | `"#F9F9FC"`      | `"#444444"`     |
| `theme.select.option.readonly.color`              | `"#BEBEBE"`      | `"#9F9F9F"`     |
| `theme.select.option.readonly.borderColor`        | `"#EBEBEB"`      | `"#626262"`     |
| `theme.rangeInput.trackColor`                     | `"#EBEBEB"`      | `"#444444"`     |
| `theme.rangeInput.thumbColor`                     | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.rangeInput.thumbHoverColor`                | `"#2B2B2C"`      | `"#BEBEBE"`     |
| `theme.rangeInput.thumbActiveColor`               | `"#626262"`      | `"#9F9F9F"`     |
| `theme.rangeInput.thumbFocusBoxShadow`            | `"#626262"`      | `"#DCDCDC"`     |
| `theme.rangeInput.thumbFocusBorderColor`          | `"#2B2B2C"`      | `"#EBEBEB"`     |
| `theme.divider.borderColor`                       | `"#EBEBEB"`      | `"#444444"`     |
| `theme.text.color`                                | `"#444444"`      | `"#DCDCDC"`     |
| `theme.text.captionColor`                         | `"#818181"`      | `"#BEBEBE"`     |
| `theme.text.linkUnderlineColor`                   | `"#444444"`      | `"#DCDCDC"`     |
| `theme.tooltip.backgroundColor`                   | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.tooltip.borderColor`                       | `"#0E0E2C"`      | `"#acacac"`     |
| `theme.tooltip.color`                             | `"#ffffff"`      | `"#444444"`     |
| `theme.popover.backgroundColor`                   | `"#ffffff"`      | `"#333"`        |
| `theme.popover.borderColor`                       | `"#EBEBEB"`      | `"#444444"`     |
| `theme.contextMenu.backgroundColor`               | `"#ffffff"`      | `"#333"`        |
| `theme.contextMenu.borderColor`                   | `"#EBEBEB"`      | `"#444444"`     |
| `theme.dialog.backdropColor`                      | `"#0E0E2C"`      | `"#2B2B2C"`     |
| `theme.dialog.backdropOpacity`                    | `0.95`           | `0.95`          |
| `theme.dialog.contentBackgroundColor`             | `"#ffffff"`      | `"#333"`        |
| `theme.disabledItemBackground.backdropColor`      | `"#ffffff"`      | `"#333"`        |
| `theme.disabledItemBackground.backdropOpacity`    | `0.9`            | `0.9`           |

## Geometry helper outputs

These are shared helper outputs, **not universal component geometry**. Card keeps its 8px radius independently of size. Alert ultimately uses 6px. Textarea overrides the bottom-right corner. Input, NumberInput, Select, Autocomplete and Textarea expose `sm`, `md`, `lg`, whereas Button exposes `xs`, `sm`, `md`, `lg`. Switch has no size prop. A helper supporting `xs` does not make `xs` a supported prop for its consumers. Icon's numeric size resolves through `fontSize`, not `spacing`.

| Helper and argument                               | Exact returned CSS object                                                                             |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `helpers.borderRadiusStyleBySize.xs`              | `{"borderRadius":"0.25rem"}`                                                                          |
| `helpers.borderRadiusStyleBySize.sm`              | `{"borderRadius":"0.375rem"}`                                                                         |
| `helpers.borderRadiusStyleBySize.md`              | `{"borderRadius":"0.5rem"}`                                                                           |
| `helpers.borderRadiusStyleBySize.lg`              | `{"borderRadius":"0.5rem"}`                                                                           |
| `helpers.paddingStyleBySize.xs`                   | `{"paddingTop":"0.25rem","paddingLeft":"0.25rem","paddingRight":"0.25rem","paddingBottom":"0.25rem"}` |
| `helpers.paddingStyleBySize.sm`                   | `{"paddingTop":"0.5rem","paddingLeft":"0.5rem","paddingRight":"0.5rem","paddingBottom":"0.5rem"}`     |
| `helpers.paddingStyleBySize.md`                   | `{"paddingTop":"1rem","paddingLeft":"1rem","paddingRight":"1rem","paddingBottom":"1rem"}`             |
| `helpers.paddingStyleBySize.lg`                   | `{"paddingTop":"1rem","paddingLeft":"1rem","paddingRight":"1rem","paddingBottom":"1rem"}`             |
| `helpers.horizontalPaddingStyleBySize.xs`         | `{"paddingLeft":"0.25rem","paddingRight":"0.25rem"}`                                                  |
| `helpers.horizontalPaddingStyleBySize.sm`         | `{"paddingLeft":"0.5rem","paddingRight":"0.5rem"}`                                                    |
| `helpers.horizontalPaddingStyleBySize.md`         | `{"paddingLeft":"1rem","paddingRight":"1rem"}`                                                        |
| `helpers.horizontalPaddingStyleBySize.lg`         | `{"paddingLeft":"1rem","paddingRight":"1rem"}`                                                        |
| `helpers.horizontalPaddingWithIconStyleBySize.xs` | `{"paddingLeft":"0.25rem","paddingRight":"1rem"}`                                                     |
| `helpers.horizontalPaddingWithIconStyleBySize.sm` | `{"paddingLeft":"0.5rem","paddingRight":"1.5rem"}`                                                    |
| `helpers.horizontalPaddingWithIconStyleBySize.md` | `{"paddingLeft":"1rem","paddingRight":"2rem"}`                                                        |
| `helpers.horizontalPaddingWithIconStyleBySize.lg` | `{"paddingLeft":"1.5rem","paddingRight":"2.5rem"}`                                                    |
| `helpers.iconStyleBySize.xs`                      | `{"right":"0.125rem"}`                                                                                |
| `helpers.iconStyleBySize.sm`                      | `{"right":"0.25rem"}`                                                                                 |
| `helpers.iconStyleBySize.md`                      | `{"right":"0.25rem"}`                                                                                 |
| `helpers.iconStyleBySize.lg`                      | `{"right":"0.5rem"}`                                                                                  |

## Component contracts

Every public Vue component from [`components/index.ts`](packages/ui/src/components/index.ts) is linked below, including multiple exports sharing a family README. Read the component-specific design axes, sizes, light/dark tables, interactions and implementation caveats before reproducing it.

| Public component                                                                         | Source family               |
| ---------------------------------------------------------------------------------------- | --------------------------- |
| [NvCard](packages/ui/src/components/display/Card/README.md)                              | `display/Card`              |
| [NvTable](packages/ui/src/components/display/Table/README.md)                            | `display/Table`             |
| [NvTableColumn](packages/ui/src/components/display/Table/README.md)                      | `display/Table`             |
| [NvAccessBlocker](packages/ui/src/components/feedback/AccessBlocker/README.md)           | `feedback/AccessBlocker`    |
| [NvAlert](packages/ui/src/components/feedback/Alert/README.md)                           | `feedback/Alert`            |
| [NvAutocomplete](packages/ui/src/components/forms/Autocomplete/README.md)                | `forms/Autocomplete`        |
| [NvButton](packages/ui/src/components/forms/Button/README.md)                            | `forms/Button`              |
| [NvFormItem](packages/ui/src/components/forms/Form/README.md)                            | `forms/Form`                |
| [NvInput](packages/ui/src/components/forms/Input/README.md)                              | `forms/Input`               |
| [NvNumberInput](packages/ui/src/components/forms/NumberInput/README.md)                  | `forms/NumberInput`         |
| [NvRangeInput](packages/ui/src/components/forms/RangeInput/README.md)                    | `forms/RangeInput`          |
| [NvOption](packages/ui/src/components/forms/Select/README.md)                            | `forms/Select`              |
| [NvSelect](packages/ui/src/components/forms/Select/README.md)                            | `forms/Select`              |
| [NvSwitch](packages/ui/src/components/forms/Switch/README.md)                            | `forms/Switch`              |
| [NvTag](packages/ui/src/components/forms/Tag/README.md)                                  | `forms/Tag`                 |
| [NvTextarea](packages/ui/src/components/forms/Textarea/README.md)                        | `forms/Textarea`            |
| [NvCenter](packages/ui/src/components/miscellaneous/Center/README.md)                    | `miscellaneous/Center`      |
| [NvDivider](packages/ui/src/components/miscellaneous/Divider/README.md)                  | `miscellaneous/Divider`     |
| [NvGroup](packages/ui/src/components/miscellaneous/Group/README.md)                      | `miscellaneous/Group`       |
| [NvStack](packages/ui/src/components/miscellaneous/Stack/README.md)                      | `miscellaneous/Stack`       |
| [NvVirtualList](packages/ui/src/components/miscellaneous/VirtualList/README.md)          | `miscellaneous/VirtualList` |
| [NvVirtualListContainer](packages/ui/src/components/miscellaneous/VirtualList/README.md) | `miscellaneous/VirtualList` |
| [NvContextMenu](packages/ui/src/components/overlay/ContextMenu/README.md)                | `overlay/ContextMenu`       |
| [NvDialog](packages/ui/src/components/overlay/Dialog/README.md)                          | `overlay/Dialog`            |
| [NvPopover](packages/ui/src/components/overlay/Popover/README.md)                        | `overlay/Popover`           |
| [NvTooltip](packages/ui/src/components/overlay/Tooltip/README.md)                        | `overlay/Tooltip`           |
| [NvIcon](packages/ui/src/components/typography/Icon/README.md)                           | `typography/Icon`           |
| [NvText](packages/ui/src/components/typography/Text/README.md)                           | `typography/Text`           |

## Styling boundaries and exceptions

- UI semantic theming uses JavaScript objects injected by `vue3-styled-components`' `ThemeProvider`. This is not a claim that the underlying libraries or positioning engines never use CSS custom properties.
- Local styling combines styled components, Tailwind classes, wrapper markup and vendor components. An unused `.styled.ts` export cannot be treated as the visible component's CSS: Popover visibly wraps content in Card; Table/TableColumn are Element Plus wrappers; Tooltip always renders a `StTooltip` div with no local CSS; the bubble's theme selectors come from `GlobalStyles` and require the matching DOM ancestry.
- `NvText`'s default body typography uses `fontSize.2` (14px at a 16px root), not `fontSize.3`. Nunito and its fallbacks are the sans stack; serif and mono remain exported even where a particular UI component does not choose them.
- Borders are selector-specific: a default token of 1px does not exclude active Button's 2px border, a borderless native range input or invisible transparent borders. Active Button also changes the border color; it is not only a thicker default Button.
- The grayscale palette contains aliases (`white`/`gray.0` and `black`/`gray.100`). Status Alert names do not introduce brand or status-color tokens; use the exact theme table and Alert README.
- [`styles/main.scss`](packages/ui/src/styles/main.scss) sets `all 0.3s` on Vue's default enter/leave active classes and opacity 0 on the default enter-from/leave-to classes. It does not establish a universal transition on every element. Local helpers and component selectors have their own rules.
- RangeInput thumb dimensions use `rem(spacing['4'])` = `0.75rem` (12px at a 16px root), not `spacing.5`. Some other dimensions are literal, such as active Button's `rem(2)` border. Divider defaults to vertical. Overlay semantics depend on the actual bindings and vendor APIs, not just variant names.

## Verification and maintenance

With Node 22 and the repository's `typescript` and `polished` dependencies available, run:

```bash
node --test tests/design-system-docs.test.cjs tests/design-system-docs-checker.test.cjs
```

The parity tests execute the checked-in token modules and exported size helpers, compare **all** root reference entries and both theme leaf sets, and verify the exact public-component README/index inventory. The checker regression suite runs isolated copied-checkout mutations to verify that missing, stale or duplicate entries, token-adapter drift and unsupported source values are rejected. The loader executes trusted checkout code: its path restrictions and Node VM are not a sandbox for untrusted source. These checks do not replace source review of component prose, rendered CSS cascade checks or accessibility tests. When component markup, styling, helpers or vendor versions change, re-review the corresponding README as well as regenerating numeric tables.

Documentation targets the current source tree. A conflict-free merge from another branch does not prove these contracts still match: in particular, changes to Dialog's mount directive or package-manager/tooling instructions must be checked against the resulting implementation. Do not rewrite a current-branch contract to describe a future branch as if it were already present.
