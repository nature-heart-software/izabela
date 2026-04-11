# NvTooltip Design Spec

Purpose: non-interactive hover/focus tooltip built on `vue-tippy`.

Source files used:

- `NvTooltip.vue`
- `tooltip.shared.ts`
- `tooltip.styled.ts`
- `tooltip.stories.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@/styles/tokens`
- `packages/design-tokens/src/main.ts`
- `packages/ui/src/main.ts`

## Component Axes

| Property                 | Kind     | Values                     | Default                          | Notes                                                                                                             |
| ------------------------ | -------- | -------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `tippyOptions`           | object   | `TippyOptions` passthrough | `{}`                             | Merged after component defaults, so consumers can override placement, delay, max width, and other tippy behavior. |
| `reference`              | slot     | content                    | required to show tooltip from UI | Rendered as the trigger slot.                                                                                     |
| Default slot             | slot     | content                    | optional                         | Rendered as tooltip content.                                                                                      |
| Interactivity            | behavior | `false`                    | `false`                          | Tooltip content is explicitly non-interactive.                                                                    |
| Trigger                  | behavior | `mouseenter focus`         | `mouseenter focus`               | Default tippy trigger string.                                                                                     |
| Focus-within suppression | behavior | `true`                     | `true`                           | Tooltip disables its tippy instance while the wrapper has focus within.                                           |

## Size Specification

| Size    | Height         | Min width | Max width | Padding X | Padding Y | Gap | Radius             | Border width | Typography | Icon size | Notes                                                     |
| ------- | -------------- | --------- | --------- | --------- | --------- | --- | ------------------ | ------------ | ---------- | --------- | --------------------------------------------------------- |
| default | content-driven | Not found | `300px`   | `4px`     | `2px`     | N/A | `xs` token (`4px`) | `1px`        | Not found  | N/A       | Global tooltip theme applies to `[data-theme="tooltip"]`. |

## Variant And State Styles

| Theme | Variant | State                | Text color                                                                   | Background color                                                                                    | Border color                                                                                | Border width | Shadow / focus ring                                         | Radius | Opacity         | Notes                                                                      |
| ----- | ------- | -------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------- | ------ | --------------- | -------------------------------------------------------------------------- |
| light | default | rest/visible         | `theme.tooltip.color` -> `colors.white` (`#ffffff`)                          | `theme.tooltip.backgroundColor` -> `buttonPlain.backgroundColor` -> `colors.gray.100` (`#0E0E2C`)   | `theme.tooltip.borderColor` -> `buttonPlain.borderColor` -> `colors.gray.100` (`#0E0E2C`)   | `1px`        | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `4px`  | `1`             | All descendants inherit the tooltip text color.                            |
| dark  | default | rest/visible         | `theme.tooltip.color` -> `buttonPlain.color` -> `colors.gray.80` (`#444444`) | `theme.tooltip.backgroundColor` -> `buttonPlain.backgroundColor` -> `lighten(0.05, colors.gray.50)` | `theme.tooltip.borderColor` -> `buttonPlain.borderColor` -> `lighten(0.05, colors.gray.50)` | `1px`        | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `4px`  | `1`             | Dark tooltip colors are computed from theme code.                          |
| light | default | hidden               | same as visible                                                              | same as visible                                                                                     | same as visible                                                                             | `1px`        | same as visible                                             | `4px`  | `0`             | Global `[data-animation][data-state='hidden']` rule sets opacity to `0`.   |
| dark  | default | hidden               | same as visible                                                              | same as visible                                                                                     | same as visible                                                                             | `1px`        | same as visible                                             | `4px`  | `0`             | Global `[data-animation][data-state='hidden']` rule sets opacity to `0`.   |
| light | default | focus-within wrapper | N/A                                                                          | N/A                                                                                                 | N/A                                                                                         | N/A          | N/A                                                         | N/A    | hidden/disabled | `useFocusWithin` disables the tippy instance while the wrapper is focused. |
| dark  | default | focus-within wrapper | N/A                                                                          | N/A                                                                                                 | N/A                                                                                         | N/A          | N/A                                                         | N/A    | hidden/disabled | `useFocusWithin` disables the tippy instance while the wrapper is focused. |

## Structure / Anatomy

| Part         | Source of truth                       | Visual role                 | Relevant styling                                                                  | Export note                         |
| ------------ | ------------------------------------- | --------------------------- | --------------------------------------------------------------------------------- | ----------------------------------- |
| Root wrapper | `StTooltip`                           | Focus-within anchor wrapper | No local visual styling                                                           | Non-visual wrapper in Figma.        |
| Trigger      | `reference` slot                      | Tooltip anchor              | Triggered by mouseenter and focus by default                                      | Keep separate from tooltip surface. |
| Surface      | tippy content with `theme: 'tooltip'` | Tooltip bubble              | `max-width: 300px`, `2px 4px` padding, `4px` radius, `1px` border, `boxShadow.lg` | Primary export target.              |
| Content      | default slot                          | Tooltip copy                | Descendant text forced to inherit tooltip color                                   | Treat as simple text/content slot.  |

## Token Mapping

| Concern             | Token                                                       | Resolved value                            | Where used                     |
| ------------------- | ----------------------------------------------------------- | ----------------------------------------- | ------------------------------ |
| Shadow              | `tokens.boxShadow.lg`                                       | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | Tooltip box shadow             |
| Border width        | `tokens.borderWidth.DEFAULT`                                | `1px`                                     | Tooltip border width           |
| Radius              | `borderRadiusStyleBySize('xs')` -> `tokens.borderRadius.xs` | `4px`                                     | Tooltip corner radius          |
| Vertical padding    | `tokens.spacing.1`                                          | `2px`                                     | Tooltip top and bottom padding |
| Horizontal padding  | `tokens.spacing.2`                                          | `4px`                                     | Tooltip left and right padding |
| Offset from trigger | `tokens.spacing.4`                                          | `12px`                                    | Tippy offset `[0, 12]`         |
| Light text          | `theme.tooltip.color`                                       | `colors.white` (`#ffffff`)                | Light tooltip text             |
| Light background    | `theme.tooltip.backgroundColor`                             | `colors.gray.100` (`#0E0E2C`)             | Light tooltip fill             |
| Light border        | `theme.tooltip.borderColor`                                 | `colors.gray.100` (`#0E0E2C`)             | Light tooltip border           |
| Dark text           | `theme.tooltip.color`                                       | `colors.gray.80` (`#444444`)              | Dark tooltip text              |
| Dark background     | `theme.tooltip.backgroundColor`                             | `lighten(0.05, colors.gray.50)`           | Dark tooltip fill              |
| Dark border         | `theme.tooltip.borderColor`                                 | `lighten(0.05, colors.gray.50)`           | Dark tooltip border            |

## Recommended Figma Mapping

| Figma property | Type                           | Suggested values           | Derived from                                          |
| -------------- | ------------------------------ | -------------------------- | ----------------------------------------------------- |
| `Theme`        | Variant                        | `light, dark`              | Theme object branches                                 |
| `State`        | Variant                        | `visible, hidden`          | Global tippy animation state                          |
| `Placement`    | Variant or documentation field | `top` plus tippy overrides | Default placement and `tippyOptions` override surface |
| `Has Content`  | Boolean                        | `true, false`              | Default slot presence                                 |

## Gaps / Assumptions

| Topic                    | Status                 | Notes                                                                                                                                 |
| ------------------------ | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Typography               | Not found              | The folder forces inherited color but does not define font family, size, or weight.                                                   |
| Interactive tooltip mode | Unsupported by default | Component sets `interactive: false`; consumers can override via `tippyOptions`, but no matching local styles are defined.             |
| Focus-visible styling    | Unsupported            | There is no dedicated focus ring or alternate focus appearance on the tooltip surface.                                                |
| Storybook `content` arg  | Ambiguous              | Storybook defines a `content` control, but the implementation renders tooltip body from the default slot instead of a `content` prop. |
