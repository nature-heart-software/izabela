# NvInput

Text input wrapper around Element Plus `ElInput` with design-system sizing and theme-driven border, background, and placeholder styles.

## Source Files Used

- `NvInput.vue`
- `input.shared.ts`
- `input.styled.ts`
- `input.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property                    | Kind             | Values                                 | Default     | Notes                                                         |
| --------------------------- | ---------------- | -------------------------------------- | ----------- | ------------------------------------------------------------- |
| `size`                      | enum             | `sm`, `md`, `lg`                       | `md`        | Controls height, radius, padding, typography.                 |
| `modelValue`                | model            | any                                    | `undefined` | Standard input value.                                         |
| native / Element Plus attrs | passthrough      | e.g. `placeholder`, `type`, `disabled` | N/A         | Passed through `$attrs`; only some states are styled locally. |
| slots                       | slot passthrough | Element Plus slots                     | N/A         | All provided slots are forwarded.                             |

## Size Specification

| Size | Height | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography                                                       | Icon size | Notes                                    |
| ---- | ------ | --------- | --------- | --------- | --- | ------ | ------------ | ---------------------------------------------------------------- | --------- | ---------------------------------------- |
| `sm` | `24px` | Not found | `8px`     | Not found | N/A | `6px`  | `1px`        | `12px`, line-height `1.4`, letter-spacing `0.32px`, weight `600` | N/A       | Password type adds right padding `32px`. |
| `md` | `32px` | Not found | `16px`    | Not found | N/A | `8px`  | `1px`        | `12px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                          |
| `lg` | `40px` | Not found | `16px`    | Not found | N/A | `8px`  | `1px`        | `14px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                          |

## Variant And State Style Tables

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| light | base | rest | `#444444` | same as text | `#ffffff` | `1px` / `#EBEBEB` | none | by size | `1` |  |
| light | base | hover | `#444444` | same as text | `#ffffff` | `1px` / `#BEBEBE` | none | by size | `1` |  |
| light | base | focus | `#444444` | same as text | `#ffffff` | `1px` / `#BEBEBE` | `0 0 0 4px #F9F9FC` | by size | `1` |  |
| light | base | placeholder | `#BEBEBE` | same as text | N/A | none | none | N/A | `1` | Placeholder weight `300`. |
| dark | base | rest | `#DCDCDC` | same as text | `darken(0.0675, #444444)` | `1px` / `#444444` | none | by size | `1` |  |
| dark | base | hover | `#DCDCDC` | same as text | `darken(0.0675, #444444)` | `1px` / `#626262` | none | by size | `1` |  |
| dark | base | focus | `#DCDCDC` | same as text | `darken(0.0675, #444444)` | `1px` / `#626262` | `0 0 0 4px #444444` | by size | `1` |  |
| dark | base | placeholder | `#818181` | same as text | N/A | none | none | N/A | `1` | Placeholder weight `300`. |

## Structure / Anatomy

| Part                        | Source of truth                      | Visual role           | Relevant styling                                        | Export note                           |
| --------------------------- | ------------------------------------ | --------------------- | ------------------------------------------------------- | ------------------------------------- |
| wrapper                     | `StInput`                            | Layout wrapper        | `display: inline-flex`; child width `100%`              | Usually not a separate visible layer. |
| Element Plus root           | `.el-input`                          | Field container       | Width inherits from wrapper                             | Base field frame.                     |
| input element               | `.el-input__inner`                   | Editable text field   | Border, background, typography, placeholder, focus ring | Main component surface.               |
| password affordance spacing | `[type='password'] .el-input__inner` | Space for reveal icon | Adds right padding `32px`                               | Note as special case variant.         |

## Token Mapping

| Concern            | Token                                      | Resolved value         | Where used                |
| ------------------ | ------------------------------------------ | ---------------------- | ------------------------- |
| radii              | `tokens.borderRadius.sm/md/DEFAULT`        | `6px`, `8px`, `8px`    | size scale                |
| heights            | `tokens.spacing[6..8]`                     | `24px`, `32px`, `40px` | size scale                |
| horizontal padding | `tokens.spacing[3]`, `tokens.spacing[5]`   | `8px`, `16px`          | size scale                |
| border width       | `tokens.borderWidth.DEFAULT`               | `1px`                  | input border              |
| focus ring spread  | `tokens.borderWidth.lg`                    | `4px`                  | focus box-shadow          |
| transition         | `tokens.transition.DEFAULT`                | `all .3s`              | hover / focus transitions |
| type scale         | `tokens.fontSize[1]`, `tokens.fontSize[2]` | `12px`, `14px`         | size scale                |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                  | Derived from          |
| -------------- | ------- | --------------------------------- | --------------------- |
| `Size`         | variant | `sm, md, lg`                      | `size` prop           |
| `State`        | variant | `rest, hover, focus, placeholder` | local styling         |
| `Theme`        | variant | `light, dark`                     | theme files           |
| `Type`         | variant | `text, password`                  | password padding rule |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                                | Status                   | Notes                                                                                             |
| ----------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------- |
| Disabled, invalid, readonly visuals | Not found in this folder | May exist in Element Plus defaults, but not documented here as source-owned styling.              |
| Exact vertical padding              | Not found                | Height is explicit; inner browser/Element Plus content alignment is not tokenized in this folder. |
