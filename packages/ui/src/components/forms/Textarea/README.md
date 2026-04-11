# NvTextarea

Textarea field styled with the same token family as `NvInput`, but with a fixed taller height and a square bottom-right corner.

## Source Files Used

- `NvTextarea.vue`
- `textarea.shared.ts`
- `textarea.styled.ts`
- `textarea.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property     | Kind        | Values                                 | Default     | Notes                                                           |
| ------------ | ----------- | -------------------------------------- | ----------- | --------------------------------------------------------------- |
| `size`       | enum        | `sm`, `md`, `lg`                       | `md`        | Controls typography, horizontal padding, and most corner radii. |
| model        | model       | any                                    | `undefined` | `defineModel()` binding.                                        |
| native attrs | passthrough | e.g. `placeholder`, `rows`, `disabled` | N/A         | Passed through to the textarea element.                         |

## Size Specification

| Size | Height              | Min width | Padding X | Padding Y        | Gap | Radius                                                 | Border width | Typography                                                       | Icon size | Notes                                                          |
| ---- | ------------------- | --------- | --------- | ---------------- | --- | ------------------------------------------------------ | ------------ | ---------------------------------------------------------------- | --------- | -------------------------------------------------------------- |
| `sm` | final height `64px` | Not found | `8px`     | top/bottom `7px` | N/A | top-left/top-right/bottom-left `6px`; bottom-right `0` | `1px`        | `12px`, line-height `1.4`, letter-spacing `0.32px`, weight `600` | N/A       | Base size height (`24px`) is overridden by final fixed height. |
| `md` | `64px`              | Not found | `16px`    | top/bottom `7px` | N/A | top-left/top-right/bottom-left `8px`; bottom-right `0` | `1px`        | `12px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                                                |
| `lg` | `64px`              | Not found | `16px`    | top/bottom `7px` | N/A | top-left/top-right/bottom-left `8px`; bottom-right `0` | `1px`        | `14px`, `1.4`, `0.32px`, weight `600`                            | N/A       |                                                                |

## Variant And State Style Tables

| Theme | Variant | State       | Text color | Background color          | Border color | Border width | Shadow / focus ring | Radius                        | Opacity | Notes                     |
| ----- | ------- | ----------- | ---------- | ------------------------- | ------------ | ------------ | ------------------- | ----------------------------- | ------- | ------------------------- |
| light | base    | rest        | `#444444`  | `#ffffff`                 | `#EBEBEB`    | `1px`        | none                | by size with bottom-right `0` | `1`     |                           |
| light | base    | hover       | `#444444`  | `#ffffff`                 | `#BEBEBE`    | `1px`        | none                | same                          | `1`     |                           |
| light | base    | focus       | `#444444`  | `#ffffff`                 | `#BEBEBE`    | `1px`        | `0 0 0 4px #F9F9FC` | same                          | `1`     |                           |
| light | base    | placeholder | `#BEBEBE`  | N/A                       | N/A          | N/A          | none                | N/A                           | `1`     | Placeholder weight `300`. |
| dark  | base    | rest        | `#DCDCDC`  | `darken(0.0675, #444444)` | `#444444`    | `1px`        | none                | by size with bottom-right `0` | `1`     |                           |
| dark  | base    | hover       | `#DCDCDC`  | `darken(0.0675, #444444)` | `#626262`    | `1px`        | none                | same                          | `1`     |                           |
| dark  | base    | focus       | `#DCDCDC`  | `darken(0.0675, #444444)` | `#626262`    | `1px`        | `0 0 0 4px #444444` | same                          | `1`     |                           |
| dark  | base    | placeholder | `#818181`  | N/A                       | N/A          | N/A          | none                | N/A                           | `1`     | Placeholder weight `300`. |

## Structure / Anatomy

| Part             | Source of truth | Visual role               | Relevant styling                                                                    | Export note             |
| ---------------- | --------------- | ------------------------- | ----------------------------------------------------------------------------------- | ----------------------- |
| textarea element | `StTextarea`    | Editable multi-line field | Border, background, typography, placeholder, fixed height, asymmetric corner radius | Main component surface. |

## Token Mapping

| Concern           | Token                                      | Resolved value      | Where used                              |
| ----------------- | ------------------------------------------ | ------------------- | --------------------------------------- |
| fixed height      | `tokens.spacing[10]`                       | `64px`              | final textarea height                   |
| vertical padding  | `tokens.spacing[3] - 1`                    | `7px`               | top and bottom padding                  |
| radii             | `tokens.borderRadius.sm/md/DEFAULT`        | `6px`, `8px`, `8px` | size scale before bottom-right override |
| border width      | `tokens.borderWidth.DEFAULT`               | `1px`               | textarea border                         |
| focus ring spread | `tokens.borderWidth.lg`                    | `4px`               | focus box-shadow                        |
| transition        | `tokens.transition.DEFAULT`                | `all .3s`           | hover / focus transitions               |
| type scale        | `tokens.fontSize[1]`, `tokens.fontSize[2]` | `12px`, `14px`      | size scale                              |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                  | Derived from  |
| -------------- | ------- | --------------------------------- | ------------- |
| `Size`         | variant | `sm, md, lg`                      | `size` prop   |
| `State`        | variant | `rest, hover, focus, placeholder` | local styling |
| `Theme`        | variant | `light, dark`                     | theme files   |

## Gaps / Assumptions

| Item                                | Status                   | Notes                                                        |
| ----------------------------------- | ------------------------ | ------------------------------------------------------------ |
| Resizable behavior                  | Not found                | No local `resize` rule in this folder.                       |
| Disabled, invalid, readonly visuals | Not found in this folder | May exist in browser defaults, but not source-authored here. |
