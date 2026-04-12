# NvSwitch

Compact boolean switch with a bordered track, sliding thumb, and focus ring. The only authored visual axis is checked vs unchecked.

## Source Files Used

- `NvSwitch.vue`
- `switch.shared.ts`
- `switch.styled.ts`
- `switch.stories.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property     | Kind     | Values          | Default | Notes                                           |
| ------------ | -------- | --------------- | ------- | ----------------------------------------------- |
| `modelValue` | boolean  | `true`, `false` | `false` | Controls thumb position and active thumb color. |
| `as`         | enum-ish | string tag name | `span`  | Styling assumes switch chrome remains the same. |

## Size Specification

| Size | Height | Min width | Padding X | Padding Y | Gap | Radius                   | Border width | Typography | Icon size | Notes                                           |
| ---- | ------ | --------- | --------- | --------- | --- | ------------------------ | ------------ | ---------- | --------- | ----------------------------------------------- |
| base | `24px` | `40px`    | `4px`     | `4px`     | N/A | track `6px`, thumb `4px` | `1px`        | N/A        | N/A       | Thumb is `16x16` and moves `16px` when checked. |

## Variant And State Style Tables

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| light | unchecked | rest | N/A | N/A | track `#ffffff`, thumb `#EBEBEB` | `1px` / `#EBEBEB` | none | track `6px`, thumb `4px` | `1` |  |
| light | unchecked | hover | N/A | N/A | track `#ffffff`, thumb `#EBEBEB` | `1px` / `#BEBEBE` | none | same | `1` | Hover only changes border. |
| light | unchecked | focus | N/A | N/A | track `#ffffff`, thumb `#EBEBEB` | `1px` / `#BEBEBE` | `0 0 0 4px #F9F9FC` | same | `1` |  |
| light | checked | rest | N/A | N/A | track `#ffffff`, thumb `#0E0E2C` | `1px` / `#EBEBEB` | none | same | `1` | Thumb offset `16px`. |
| dark | unchecked | rest | N/A | N/A | track `darken(0.0675, #444444)`, thumb `#626262` | `1px` / `#444444` | none | same | `1` |  |
| dark | unchecked | hover | N/A | N/A | track `darken(0.0675, #444444)`, thumb `#626262` | `1px` / `#626262` | none | same | `1` |  |
| dark | unchecked | focus | N/A | N/A | track `darken(0.0675, #444444)`, thumb `#626262` | `1px` / `#626262` | `0 0 0 4px #444444` | same | `1` |  |
| dark | checked | rest | N/A | N/A | track `darken(0.0675, #444444)`, thumb `lighten(0.05, #9F9F9F)` | `1px` / `#444444` | none | same | `1` | Thumb offset `16px`. |

## Structure / Anatomy

| Part            | Source of truth                  | Visual role                 | Relevant styling                                 | Export note                       |
| --------------- | -------------------------------- | --------------------------- | ------------------------------------------------ | --------------------------------- |
| root track      | `StSwitch`                       | Interactive track container | Size, padding, background, focus ring            | Main switch component.            |
| thumb           | `::before`                       | Sliding handle              | Size `16x16`, background, left offset transition | Separate thumb sub-layer.         |
| border overlay  | `::after`                        | Track stroke                | 1px border matching theme state                  | Keep as separate stroke in Figma. |
| hidden checkbox | `<input hidden type='checkbox'>` | Native form hook            | No visible styling                               | Usually omitted from Figma.       |

## Token Mapping

| Concern           | Token                                              | Resolved value | Where used           |
| ----------------- | -------------------------------------------------- | -------------- | -------------------- |
| track width       | `tokens.spacing[8]`                                | `40px`         | root width           |
| track height      | `tokens.spacing[6]`                                | `24px`         | root height          |
| padding           | `tokens.spacing[2]`                                | `4px`          | root padding         |
| thumb size        | `tokens.spacing[5]`                                | `16px`         | thumb                |
| checked offset    | `tokens.spacing[5]`                                | `16px`         | thumb left offset    |
| radii             | `tokens.borderRadius.sm`, `tokens.borderRadius.xs` | `6px`, `4px`   | track and thumb      |
| border width      | `tokens.borderWidth.DEFAULT`                       | `1px`          | track border overlay |
| focus ring spread | `tokens.borderWidth.lg`                            | `4px`          | root focus ring      |
| transition        | `tokens.transition.DEFAULT`                        | `all .3s`      | root, thumb, border  |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values     | Derived from                |
| -------------- | ------- | -------------------- | --------------------------- |
| `State`        | variant | `rest, hover, focus` | authored interaction states |
| `Checked`      | boolean | `true, false`        | `modelValue`                |
| `Theme`        | variant | `light, dark`        | theme files                 |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                              | Status      | Notes                                                                                                        |
| --------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| Disabled state                    | Unsupported | No disabled styling or prop in this folder.                                                                  |
| Native input change event payload | Ambiguous   | Hidden checkbox emits `$event.target.value`, but click handler separately emits the intended boolean toggle. |
