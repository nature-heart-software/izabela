# NvTag

Compact label chip with optional close action. The close affordance is a nested `NvButton` rendered as a ghost `xs` icon button.

## Source Files Used

- `NvTag.vue`
- `tag.shared.ts`
- `tag.styled.ts`
- `tag.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property     | Kind    | Values          | Default | Notes                                                               |
| ------------ | ------- | --------------- | ------- | ------------------------------------------------------------------- |
| `closable`   | boolean | `true`, `false` | `false` | Adds trailing close button and increases right padding reservation. |
| default slot | slot    | tag label       | N/A     | Main content.                                                       |

## Size Specification

| Size | Height | Min width | Padding X                           | Padding Y | Gap       | Radius | Border width | Typography                                                       | Icon size                                                     | Notes                                   |
| ---- | ------ | --------- | ----------------------------------- | --------- | --------- | ------ | ------------ | ---------------------------------------------------------------- | ------------------------------------------------------------- | --------------------------------------- |
| base | `24px` | `0`       | `8px` or `8px / 20px` when closable | `0`       | Not found | `6px`  | `1px`        | `12px`, line-height `1.4`, letter-spacing `0.32px`, weight `600` | close button is nested `NvButton size='xs'` with icon `times` | Content wrapper uses ellipsis overflow. |

## Variant And State Style Tables

| Theme | Variant | State | Text color                           | Icon color   | Background / fill         | Border / stroke   | Shadow / effects | Radius | Opacity | Notes                                           |
| ----- | ------- | ----- | ------------------------------------ | ------------ | ------------------------- | ----------------- | ---------------- | ------ | ------- | ----------------------------------------------- |
| light | base    | rest  | inherited / Not found in this folder | same as text | `#ffffff`                 | `1px` / `#EBEBEB` | none             | `6px`  | `1`     | Root tag itself has no local hover/focus state. |
| dark  | base    | rest  | inherited / Not found in this folder | same as text | `darken(0.0675, #444444)` | `1px` / `#444444` | none             | `6px`  | `1`     |                                                 |

## Structure / Anatomy

| Part               | Source of truth       | Visual role                | Relevant styling                                                             | Export note                                      |
| ------------------ | --------------------- | -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------ |
| root chip          | `StTag`               | Surface container          | Height, border, radius, background                                           | Main chip frame.                                 |
| content wrapper    | `StTagContentWrapper` | Label layout               | Negative margin to absorb border; ellipsis; size-specific horizontal padding | Auto-layout text region.                         |
| close icon wrapper | `StTagIcon`           | Positions close affordance | Absolute-style icon offset from `iconStyleBySize('sm')`                      | Optional trailing affordance.                    |
| close button       | nested `NvButton`     | Interactive removal action | `type='ghost'`, `size='xs'`, icon `times`                                    | Can be represented as nested component instance. |

## Token Mapping

| Concern            | Token                                   | Resolved value       | Where used                   |
| ------------------ | --------------------------------------- | -------------------- | ---------------------------- |
| height             | `tokens.spacing[6]`                     | `24px`               | root tag                     |
| border width       | `tokens.borderWidth.DEFAULT`            | `1px`                | root border                  |
| radius             | `tokens.borderRadius.sm`                | `6px`                | root radius                  |
| type scale         | `tokens.fontSize[1]`                    | `12px`               | root text                    |
| padding no close   | `tokens.spacing[3]`                     | `8px`                | left and right padding       |
| padding with close | `tokens.spacing[3] + tokens.spacing[5]` | `20px` right reserve | closable mode                |
| close icon offset  | `iconStyleBySize('sm')`                 | `right: 4px`         | close affordance positioning |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values | Derived from    |
| -------------- | ------- | ---------------- | --------------- |
| `Closable`     | boolean | `true, false`    | `closable` prop |
| `Theme`        | variant | `light, dark`    | theme files     |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                       | Status      | Notes                                                           |
| -------------------------- | ----------- | --------------------------------------------------------------- |
| Root hover / focus styling | Unsupported | Only the nested close button has interactive styling.           |
| Local text color token     | Not found   | Tag root does not set `color`; it inherits from parent context. |
