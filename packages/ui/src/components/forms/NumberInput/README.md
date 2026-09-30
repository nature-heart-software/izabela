# NvNumberInput

Numeric input wrapper around Element Plus `ElInput` with the same design language as `NvInput`, plus a minimum field width and numeric input type.

## Source Files Used

- `NvNumberInput.vue`
- `number-input.shared.ts`
- `number-input.styled.ts`
- `number-input.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property                    | Kind             | Values                                   | Default     | Notes                                         |
| --------------------------- | ---------------- | ---------------------------------------- | ----------- | --------------------------------------------- |
| `size`                      | enum             | `sm`, `md`, `lg`                         | `md`        | Controls height, radius, padding, typography. |
| `modelValue`                | model            | any                                      | `undefined` | Bound to numeric Element Plus input.          |
| native / Element Plus attrs | passthrough      | e.g. `placeholder`, `min`, `max`, `step` | N/A         | Passed through `$attrs`.                      |
| slots                       | slot passthrough | Element Plus slots                       | N/A         | All provided slots are forwarded.             |

## Size Specification

| Size | Height | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography                                                       | Icon size | Notes                                                        |
| ---- | ------ | --------- | --------- | --------- | --- | ------ | ------------ | ---------------------------------------------------------------- | --------- | ------------------------------------------------------------ |
| `sm` | `24px` | `80px`    | `8px`     | Not found | N/A | `6px`  | `1px`        | `12px`, line-height `1.4`, letter-spacing `0.32px`, weight `600` | N/A       | Wrapper width is `min-content`; inner field width is `100%`. |
| `md` | `32px` | `80px`    | `16px`    | Not found | N/A | `8px`  | `1px`        | `12px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                                              |
| `lg` | `40px` | `80px`    | `16px`    | Not found | N/A | `8px`  | `1px`        | `14px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                                              |

## Variant And State Style Tables

| Theme | Variant | State       | Text color | Icon color   | Background / fill         | Border / stroke   | Shadow / effects    | Radius  | Opacity | Notes                     |
| ----- | ------- | ----------- | ---------- | ------------ | ------------------------- | ----------------- | ------------------- | ------- | ------- | ------------------------- |
| light | base    | rest        | `#444444`  | same as text | `#ffffff`                 | `1px` / `#EBEBEB` | none                | by size | `1`     |                           |
| light | base    | hover       | `#444444`  | same as text | `#ffffff`                 | `1px` / `#BEBEBE` | none                | by size | `1`     |                           |
| light | base    | focus       | `#444444`  | same as text | `#ffffff`                 | `1px` / `#BEBEBE` | `0 0 0 4px #F9F9FC` | by size | `1`     |                           |
| light | base    | placeholder | `#BEBEBE`  | same as text | N/A                       | none              | none                | N/A     | `1`     | Placeholder weight `300`. |
| dark  | base    | rest        | `#DCDCDC`  | same as text | `darken(0.0675, #444444)` | `1px` / `#444444` | none                | by size | `1`     |                           |
| dark  | base    | hover       | `#DCDCDC`  | same as text | `darken(0.0675, #444444)` | `1px` / `#626262` | none                | by size | `1`     |                           |
| dark  | base    | focus       | `#DCDCDC`  | same as text | `darken(0.0675, #444444)` | `1px` / `#626262` | `0 0 0 4px #444444` | by size | `1`     |                           |
| dark  | base    | placeholder | `#818181`  | same as text | N/A                       | none              | none                | N/A     | `1`     | Placeholder weight `300`. |

## Structure / Anatomy

| Part              | Source of truth    | Visual role            | Relevant styling                                                          | Export note                           |
| ----------------- | ------------------ | ---------------------- | ------------------------------------------------------------------------- | ------------------------------------- |
| wrapper           | `StNumberInput`    | Layout wrapper         | `display: inline-flex`, width `min-content`                               | Usually not a separate visible layer. |
| Element Plus root | `.el-input`        | Field container        | Width inherits from wrapper                                               | Base field frame.                     |
| input element     | `.el-input__inner` | Editable numeric field | Border, background, typography, placeholder, focus ring, min-width `80px` | Main component surface.               |

## Token Mapping

| Concern            | Token                                    | Resolved value         | Where used                |
| ------------------ | ---------------------------------------- | ---------------------- | ------------------------- |
| radii              | `tokens.borderRadius.sm/md/DEFAULT`      | `6px`, `8px`, `8px`    | size scale                |
| heights            | `tokens.spacing[6..8]`                   | `24px`, `32px`, `40px` | size scale                |
| horizontal padding | `tokens.spacing[3]`, `tokens.spacing[5]` | `8px`, `16px`          | size scale                |
| border width       | `tokens.borderWidth.DEFAULT`             | `1px`                  | number input border       |
| focus ring spread  | `tokens.borderWidth.lg`                  | `4px`                  | focus box-shadow          |
| transition         | `tokens.transition.DEFAULT`              | `all .3s`              | hover / focus transitions |
| min width          | hard-coded                               | `80px`                 | `.el-input__inner`        |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                  | Derived from  |
| -------------- | ------- | --------------------------------- | ------------- |
| `Size`         | variant | `sm, md, lg`                      | `size` prop   |
| `State`        | variant | `rest, hover, focus, placeholder` | local styling |
| `Theme`        | variant | `light, dark`                     | theme files   |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                                | Status                   | Notes                                                          |
| ----------------------------------- | ------------------------ | -------------------------------------------------------------- |
| Disabled, invalid, readonly visuals | Not found in this folder | May exist in Element Plus defaults, but not source-owned here. |
| Browser spin-button treatment       | Not found                | No local styling for native number steppers.                   |
