# NvRangeInput

Horizontal range slider with a custom WebKit track and thumb. This folder defines a single visual style with interaction states on the thumb.

## Source Files Used

- `NvRangeInput.vue`
- `range-input.shared.ts`
- `range-input.styled.ts`
- `range-input.stories.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property     | Kind     | Values          | Default | Notes                                        |
| ------------ | -------- | --------------- | ------- | -------------------------------------------- |
| `modelValue` | model    | number          | `0`     | Bound to the native range value.             |
| `as`         | enum-ish | string tag name | `input` | Styling assumes native range input behavior. |

## Size Specification

| Size | Height                    | Min width | Padding X | Padding Y | Gap | Radius      | Border width             | Typography | Icon size | Notes                                                       |
| ---- | ------------------------- | --------- | --------- | --------- | --- | ----------- | ------------------------ | ---------- | --------- | ----------------------------------------------------------- |
| base | thumb `16px`, track `4px` | Not found | `0`       | `0`       | N/A | thumb `8px` | thumb focus border `1px` | N/A        | N/A       | Root width is hard-coded to `15rem` (`240px` at 16px base). |

## Variant And State Style Tables

| Theme | Variant | State  | Text color | Background color         | Border color             | Border width | Shadow / focus ring | Radius | Opacity | Notes                                                               |
| ----- | ------- | ------ | ---------- | ------------------------ | ------------------------ | ------------ | ------------------- | ------ | ------- | ------------------------------------------------------------------- |
| light | track   | rest   | N/A        | `#EBEBEB`                | N/A                      | `0`          | none                | `0`    | `1`     | WebKit track only.                                                  |
| light | thumb   | rest   | N/A        | `#0E0E2C`                | `#0E0E2C`                | `0`          | none                | `8px`  | `1`     |                                                                     |
| light | thumb   | hover  | N/A        | `#2B2B2C`                | `#2B2B2C`                | `0`          | none                | `8px`  | `1`     |                                                                     |
| light | thumb   | active | N/A        | `#626262`                | `#626262`                | `0`          | none                | `8px`  | `1`     |                                                                     |
| light | thumb   | focus  | N/A        | `#0E0E2C`                | `#2B2B2C`                | `1px`        | `0 0 0 4px #626262` | `8px`  | `1`     | Focus ring uses WebKit thumb focus plus separate border color rule. |
| dark  | track   | rest   | N/A        | `#444444`                | N/A                      | `0`          | none                | `0`    | `1`     |                                                                     |
| dark  | thumb   | rest   | N/A        | `lighten(0.05, #9F9F9F)` | `lighten(0.05, #9F9F9F)` | `0`          | none                | `8px`  | `1`     |                                                                     |
| dark  | thumb   | hover  | N/A        | `#BEBEBE`                | `#BEBEBE`                | `0`          | none                | `8px`  | `1`     |                                                                     |
| dark  | thumb   | active | N/A        | `#9F9F9F`                | `#9F9F9F`                | `0`          | none                | `8px`  | `1`     |                                                                     |
| dark  | thumb   | focus  | N/A        | `lighten(0.05, #9F9F9F)` | `#EBEBEB`                | `1px`        | `0 0 0 4px #DCDCDC` | `8px`  | `1`     |                                                                     |

## Structure / Anatomy

| Part       | Source of truth                   | Visual role      | Relevant styling                           | Export note            |
| ---------- | --------------------------------- | ---------------- | ------------------------------------------ | ---------------------- |
| root input | `StRangeInput`                    | Native slider    | `appearance: none`, width `15rem`          | Main component.        |
| track      | `::-webkit-slider-runnable-track` | Value rail       | Height `4px`, themed fill                  | Use as base rail.      |
| thumb      | `::-webkit-slider-thumb`          | Draggable handle | `16x16`, centered with negative top margin | Main interactive knob. |

## Token Mapping

| Concern            | Token                         | Resolved value | Where used                    |
| ------------------ | ----------------------------- | -------------- | ----------------------------- |
| track height       | `tokens.spacing[2]`           | `4px`          | track                         |
| thumb size         | `tokens.spacing[4]`           | `12px`         | `height` and `width` of thumb |
| thumb radius       | `tokens.borderRadius.DEFAULT` | `8px`          | thumb                         |
| focus ring spread  | `tokens.borderWidth.lg`       | `4px`          | thumb focus ring              |
| focus border width | `tokens.borderWidth.DEFAULT`  | `1px`          | thumb focus border            |
| root width         | hard-coded                    | `15rem`        | root slider width             |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values             | Derived from       |
| -------------- | ------- | ---------------------------- | ------------------ |
| `State`        | variant | `rest, hover, active, focus` | thumb interactions |
| `Theme`        | variant | `light, dark`                | theme files        |

## Gaps / Assumptions

| Item                       | Status      | Notes                                                  |
| -------------------------- | ----------- | ------------------------------------------------------ |
| Non-WebKit styling         | Unsupported | Only WebKit pseudo-elements are styled in this folder. |
| Value-filled track segment | Unsupported | No separate progress fill styling.                     |
| Disabled state             | Unsupported | No disabled visuals in this folder.                    |
