# NvAlert Design Notes

Purpose: renders short feedback messages with theme-aware background and foreground colors across four semantic types.

Source files used:

- `NvAlert.vue`
- `alert.shared.ts`
- `alert.styled.ts`
- `alert.stories.ts`
- `@/components/typography/Text/text.styled.ts`
- `@/components/typography/Text/text.shared.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property | Kind        | Values                                | Default | Notes                                                                                                                                                        |
| -------- | ----------- | ------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `type`   | enum prop   | `success`, `warning`, `info`, `error` | `info`  | Drives alert background and text color from theme tokens.                                                                                                    |
| `size`   | enum prop   | `xs`, `sm`, `md`, `lg`                | `md`    | Drives padding and min height.                                                                                                                               |
| `as`     | string prop | Any HTML tag string                   | `'div'` | Passed into styled props, but the styled root is declared as `styled('div', props)`, so supported rendered tag behavior is Not found from this folder alone. |
| content  | slot        | Any inline content                    | N/A     | Rendered inside a nested `NvText` with inherited color.                                                                                                      |

## Size Specification

| Size | Height | Min width | Padding X            | Padding Y            | Gap       | Radius                    | Border width | Typography                                                                                                                      | Icon size   | Notes                                                                                    |
| ---- | ------ | --------- | -------------------- | -------------------- | --------- | ------------------------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------- |
| `xs` | Auto   | Not found | `spacing.2` = `4px`  | `spacing.2` = `4px`  | Not found | `borderRadius.sm` = `6px` | `0`          | `NvText` default body: `fontSize.2` = `14px`, `line-height: 1.4`, letter spacing `0.32px`, font family `Nunito, system-ui, ...` | Unsupported | Size helper computes `4px` radius first, then root styling overrides all sizes to `6px`. |
| `sm` | Auto   | Not found | `spacing.3` = `8px`  | `spacing.3` = `8px`  | Not found | `borderRadius.sm` = `6px` | `0`          | `NvText` default body: `14px / 1.4 / 0.32px`, Nunito sans stack                                                                 | Unsupported | `min-height` `spacing.6` = `24px`.                                                       |
| `md` | Auto   | Not found | `spacing.5` = `16px` | `spacing.5` = `16px` | Not found | `borderRadius.sm` = `6px` | `0`          | `NvText` default body: `14px / 1.4 / 0.32px`, Nunito sans stack                                                                 | Unsupported | `min-height` `spacing.7` = `32px`.                                                       |
| `lg` | Auto   | Not found | `spacing.5` = `16px` | `spacing.5` = `16px` | Not found | `borderRadius.sm` = `6px` | `0`          | `NvText` default body: `14px / 1.4 / 0.32px`, Nunito sans stack                                                                 | Unsupported | `min-height` `spacing.8` = `40px`.                                                       |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| light | `info` | rest | `colors.white` (`#ffffff`) | same as text | `colors.black` (`#0E0E2C`) | none | None | `6px` | 1 | Semantic inversion compared with other alert types in light theme. |
| light | `success` | rest | `colors.black` (`#0E0E2C`) | same as text | `backgroundColor` = `colors.white` (`#ffffff`) | none | None | `6px` | 1 | No success-specific hue in theme. |
| light | `warning` | rest | `colors.black` (`#0E0E2C`) | same as text | `backgroundColor` = `colors.white` (`#ffffff`) | none | None | `6px` | 1 | No warning-specific hue in theme. |
| light | `error` | rest | `colors.black` (`#0E0E2C`) | same as text | `backgroundColor` = `colors.white` (`#ffffff`) | none | None | `6px` | 1 | No error-specific hue in theme. |
| dark | `info` | rest | `colors.black` (`#0E0E2C`) | same as text | `colors.white` (`#ffffff`) | none | None | `6px` | 1 | Semantic inversion compared with other alert types in dark theme. |
| dark | `success` | rest | `colors.white` (`#ffffff`) | same as text | `backgroundColor` = `darken(0.0675, colors.gray['80'])` = `#333333` | none | None | `6px` | 1 | No success-specific hue in theme. |
| dark | `warning` | rest | `colors.white` (`#ffffff`) | same as text | `backgroundColor` = `darken(0.0675, colors.gray['80'])` = `#333333` | none | None | `6px` | 1 | No warning-specific hue in theme. |
| dark | `error` | rest | `colors.white` (`#ffffff`) | same as text | `backgroundColor` = `darken(0.0675, colors.gray['80'])` = `#333333` | none | None | `6px` | 1 | No error-specific hue in theme. |

## Structure / Anatomy

| Part            | Source of truth                | Visual role                         | Relevant styling                                                                     | Export note                                                                      |
| --------------- | ------------------------------ | ----------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| alert container | `StAlert` in `alert.styled.ts` | Semantic message surface            | Theme-driven fill and text color, size-driven padding, `min-height`, `border-radius` | Figma base frame should own size and semantic variants.                          |
| text wrapper    | `NvAlert.vue` -> `NvText`      | Typography and inherited text color | Inline style sets `color: inherit`; default `NvText` body typography applies         | Model text as a content slot with inherited color, not a separate color variant. |
| slot content    | `NvAlert.vue`                  | Message copy                        | No icon, helper, or action region defined                                            | Keep component anatomy minimal: container + text content only.                   |

## Token Mapping

| Concern                                  | Token                                                                                                                                                                         | Resolved value                                                                                                                                                                                             | Where used                               |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| size `xs` padding                        | `spacing.2`                                                                                                                                                                   | `4px`                                                                                                                                                                                                      | `padding-top/right/bottom/left` for `xs` |
| size `sm` padding                        | `spacing.3`                                                                                                                                                                   | `8px`                                                                                                                                                                                                      | `padding-top/right/bottom/left` for `sm` |
| size `md` padding                        | `spacing.5`                                                                                                                                                                   | `16px`                                                                                                                                                                                                     | `padding-top/right/bottom/left` for `md` |
| size `lg` padding                        | `spacing.5`                                                                                                                                                                   | `16px`                                                                                                                                                                                                     | `padding-top/right/bottom/left` for `lg` |
| size `xs` min height                     | `spacing.5`                                                                                                                                                                   | `16px`                                                                                                                                                                                                     | `min-height` for `xs`                    |
| size `sm` min height                     | `spacing.6`                                                                                                                                                                   | `24px`                                                                                                                                                                                                     | `min-height` for `sm`                    |
| size `md` min height                     | `spacing.7`                                                                                                                                                                   | `32px`                                                                                                                                                                                                     | `min-height` for `md`                    |
| size `lg` min height                     | `spacing.8`                                                                                                                                                                   | `40px`                                                                                                                                                                                                     | `min-height` for `lg`                    |
| radius                                   | `borderRadius.sm`                                                                                                                                                             | `6px`                                                                                                                                                                                                      | Final root radius for all sizes          |
| text font family                         | `fontFamily.sans`                                                                                                                                                             | `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` | Nested `NvText` default typography       |
| text font size                           | `fontSize.2`                                                                                                                                                                  | `14px`                                                                                                                                                                                                     | Nested `NvText` default typography       |
| text line height                         | `fontSize.2.lineHeight`                                                                                                                                                       | `1.4`                                                                                                                                                                                                      | Nested `NvText` default typography       |
| text letter spacing                      | `fontSize.2.letterSpacing`                                                                                                                                                    | `0.32px`                                                                                                                                                                                                   | Nested `NvText` default typography       |
| light info background                    | `theme.alert.info.backgroundColor` -> `colors.black`                                                                                                                          | `#0E0E2C`                                                                                                                                                                                                  | Light `info` variant container fill      |
| light info text                          | `theme.alert.info.color` -> `colors.white`                                                                                                                                    | `#ffffff`                                                                                                                                                                                                  | Light `info` variant text                |
| light success, warning, error background | `theme.alert.success.backgroundColor`, `theme.alert.warning.backgroundColor`, `theme.alert.error.backgroundColor` -> `backgroundColor` -> `colors.white`                      | `#ffffff`                                                                                                                                                                                                  | Light non-info container fill            |
| light success, warning, error text       | `theme.alert.success.color`, `theme.alert.warning.color`, `theme.alert.error.color` -> `colors.black`                                                                         | `#0E0E2C`                                                                                                                                                                                                  | Light non-info text                      |
| dark info background                     | `theme.alert.info.backgroundColor` -> `colors.white`                                                                                                                          | `#ffffff`                                                                                                                                                                                                  | Dark `info` variant container fill       |
| dark info text                           | `theme.alert.info.color` -> `colors.black`                                                                                                                                    | `#0E0E2C`                                                                                                                                                                                                  | Dark `info` variant text                 |
| dark success, warning, error background  | `theme.alert.success.backgroundColor`, `theme.alert.warning.backgroundColor`, `theme.alert.error.backgroundColor` -> `backgroundColor` -> `darken(0.0675, colors.gray['80'])` | `#333333`                                                                                                                                                                                                  | Dark non-info container fill             |
| dark success, warning, error text        | `theme.alert.success.color`, `theme.alert.warning.color`, `theme.alert.error.color` -> `colors.white`                                                                         | `#ffffff`                                                                                                                                                                                                  | Dark non-info text                       |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                      | Derived from                   |
| -------------- | ------- | ------------------------------------- | ------------------------------ |
| `Theme`        | Variant | `light`, `dark`                       | Theme-specific semantic colors |
| `Type`         | Variant | `info`, `success`, `warning`, `error` | `type` prop                    |
| `Size`         | Variant | `xs`, `sm`, `md`, `lg`                | `size` prop                    |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Topic                                       | Status      | Notes                                                                                                                                                                  |
| ------------------------------------------- | ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Success, warning, and error differentiation | Ambiguous   | The implementation exposes three semantic types, but theme values for those types are identical within each theme. Designers must decide whether that is intentional.  |
| Interactive states                          | Unsupported | No hover, focus, active, disabled, loading, or selected styling is defined for `NvAlert`.                                                                              |
| Border                                      | Unsupported | No border color or width is defined.                                                                                                                                   |
| Rendered `as` element behavior              | Not found   | The prop exists, but this folder does not prove the styled component actually changes its rendered tag.                                                                |
| Radius by size                              | Ambiguous   | `styleBySize()` computes size-specific radius values, but `StAlert` immediately applies `borderRadiusStyleBySize('sm')`, making the final radius `6px` for every size. |
| Icon / action affordances                   | Unsupported | No icon, dismiss button, or action slot exists in this folder.                                                                                                         |
