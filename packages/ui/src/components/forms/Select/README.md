# NvSelect / NvOption

Select family built from an input-like trigger (`NvSelect`), a portalled autocomplete popup (`NvAutocomplete`), and row components (`NvOption`). Supports single and multiple selection, grouped options, search filtering, and removable selected tags.

## Source Files Used

- `NvSelect.vue`
- `NvOption.vue`
- `select.shared.ts`
- `select.styled.ts`
- `select.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property            | Kind         | Values                   | Default     | Notes                                                                                            |
| ------------------- | ------------ | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------ |
| `size`              | enum         | `sm`, `md`, `lg`         | `md`        | Controls trigger min-height, trigger/input height, radius, padding, type, icon offset.           |
| `multiple`          | boolean      | `true`, `false`          | `false`     | Multiple mode renders removable `NvTag` chips and emits arrays.                                  |
| `modelValue`        | model        | scalar, object, or array | `undefined` | Array only in multiple mode.                                                                     |
| `options`           | array        | `Option[]`               | `[]`        | Supports flat or grouped options.                                                                |
| `valueKey`          | string       | any string               | `''`        | Used for stable comparisons when values are objects.                                             |
| `autocompleteWidth` | number       | any number               | `undefined` | Passed through to popup width override.                                                          |
| `isFocused`         | boolean      | `true`, `false`          | `false`     | Public prop exists, but local focus trap drives the actual styled focus state in this component. |
| grouped option      | content mode | `true`, `false`          | false       | Parent option with `children` becomes readonly group header and flattens child rows.             |
| option `disabled`   | boolean      | `true`, `false`          | false       | Row-level disabled state.                                                                        |
| option `active`     | boolean      | `true`, `false`          | false       | Keyboard-highlighted row state.                                                                  |
| option `selected`   | boolean      | `true`, `false`          | false       | Applied when row value matches current selection.                                                |

## Size Specification

| Size         | Height                         | Min width | Padding X                   | Padding Y            | Gap                                         | Radius    | Border width | Typography                                                       | Icon size                   | Notes                     |
| ------------ | ------------------------------ | --------- | --------------------------- | -------------------- | ------------------------------------------- | --------- | ------------ | ---------------------------------------------------------------- | --------------------------- | ------------------------- |
| `sm` trigger | min `24px`; inner input `20px` | Not found | `8px / 20px` (icon reserve) | `4px` top and bottom | tag/group spacing external                  | `6px`     | `1px`        | `12px`, line-height `1.4`, letter-spacing `0.32px`, weight `600` | `tokens.spacing[3]` = `8px` | Icon right offset `4px`.  |
| `md` trigger | min `32px`; inner input `24px` | Not found | `16px / 28px`               | `4px` top and bottom | external                                    | `8px`     | `1px`        | `12px`, `1.4`, `0.32px`, weight `600`                            | `16px`                      | Icon right offset `4px`.  |
| `lg` trigger | min `40px`; inner input `32px` | Not found | `24px / 36px`               | `4px` top and bottom | external                                    | `8px`     | `1px`        | `14px`, `1.4`, `0.32px`, weight `600`                            | `16px`                      | Icon right offset `8px`.  |
| option row   | `32px`                         | Not found | `16px`                      | `0`                  | `8px` min between content and trailing slot | Not found | `0`          | `NvText` default = `14px`, `1.4`, `0.32px`                       | N/A                         | Same across select sizes. |

## Variant And State Style Tables

| Theme | Variant             | State          | Text color                | Background color                                                   | Border color | Border width | Shadow / focus ring | Radius    | Opacity | Notes                                                                                     |
| ----- | ------------------- | -------------- | ------------------------- | ------------------------------------------------------------------ | ------------ | ------------ | ------------------- | --------- | ------- | ----------------------------------------------------------------------------------------- |
| light | trigger             | rest           | `#444444`                 | `#ffffff`                                                          | `#EBEBEB`    | `1px`        | none                | by size   | `1`     |                                                                                           |
| light | trigger             | hover          | `#444444`                 | `#ffffff`                                                          | `#BEBEBE`    | `1px`        | none                | by size   | `1`     |                                                                                           |
| light | trigger             | focus          | `#444444`                 | `#ffffff`                                                          | `#BEBEBE`    | `1px`        | `0 0 0 4px #F9F9FC` | by size   | `1`     | Driven by focus trap.                                                                     |
| light | trigger placeholder | placeholder    | `#BEBEBE`                 | N/A                                                                | N/A          | N/A          | none                | N/A       | `1`     | Placeholder weight `300`.                                                                 |
| dark  | trigger             | rest           | `#DCDCDC`                 | `darken(0.0675, #444444)`                                          | `#444444`    | `1px`        | none                | by size   | `1`     |                                                                                           |
| dark  | trigger             | hover          | `#DCDCDC`                 | `darken(0.0675, #444444)`                                          | `#626262`    | `1px`        | none                | by size   | `1`     |                                                                                           |
| dark  | trigger             | focus          | `#DCDCDC`                 | `darken(0.0675, #444444)`                                          | `#626262`    | `1px`        | `0 0 0 4px #444444` | by size   | `1`     |                                                                                           |
| light | option              | rest           | `#444444`                 | transparent                                                        | transparent  | `0`          | none                | Not found | `1`     |                                                                                           |
| light | option              | hover          | `#444444`                 | `#F9F9FC`                                                          | transparent  | `0`          | none                | Not found | `1`     |                                                                                           |
| light | option              | selected       | `#444444`                 | `#EBEBEB`                                                          | transparent  | `0`          | none                | Not found | `1`     | Font weight `700`.                                                                        |
| light | option              | active         | `#444444`                 | `#BEBEBE`                                                          | transparent  | `0`          | none                | Not found | `1`     | Keyboard-highlight state.                                                                 |
| light | option              | disabled       | `#ffffff`                 | transparent                                                        | transparent  | `0`          | none                | Not found | `1`     | Uses `theme.select.option.disabled.backgroundColor`, despite being applied as text color. |
| light | option              | readonly group | `#BEBEBE`                 | group background `#ffffff`; divider line `#EBEBEB`                 | N/A          | `0`          | none                | Not found | `1`     | Group headers are non-interactive and draw a line behind text.                            |
| dark  | option              | rest           | `#DCDCDC`                 | transparent                                                        | transparent  | `0`          | none                | Not found | `1`     |                                                                                           |
| dark  | option              | hover          | `#DCDCDC`                 | `#444444`                                                          | transparent  | `0`          | none                | Not found | `1`     |                                                                                           |
| dark  | option              | selected       | `#DCDCDC`                 | `darken(0.0675, #626262)`                                          | transparent  | `0`          | none                | Not found | `1`     | Font weight `700`.                                                                        |
| dark  | option              | active         | `#DCDCDC`                 | `#2B2B2C`                                                          | transparent  | `0`          | none                | Not found | `1`     |                                                                                           |
| dark  | option              | disabled       | `darken(0.0675, #444444)` | transparent                                                        | transparent  | `0`          | none                | Not found | `1`     | Uses background token as text color.                                                      |
| dark  | option              | readonly group | `#9F9F9F`                 | group background `darken(0.0675, #444444)`; divider line `#626262` | N/A          | `0`          | none                | Not found | `1`     |                                                                                           |

## Structure / Anatomy

| Part          | Source of truth                 | Visual role                    | Relevant styling                                                  | Export note                                |
| ------------- | ------------------------------- | ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------ |
| trigger shell | `StSelect`                      | Input-like container           | Border, radius, focus ring, padding, min-height                   | Main select frame.                         |
| inner wrapper | `StSelectWrapper`               | Holds chips + input            | `display: flex`, negative vertical margins to absorb border width | Auto-layout wrapper inside trigger.        |
| chips area    | `StSelectTagsWrapper` + `NvTag` | Multiple-selection summary     | Left offset `-16px`; tags wrap in `NvGroup`                       | Separate nested component family in Figma. |
| text input    | `StSelectInput`                 | Search field / displayed label | Inherits trigger type style and placeholder colors                | Model as text field region within trigger. |
| caret icon    | `StSelectIcon`                  | Dropdown affordance            | Absolute positioned trailing icon                                 | Boolean-visible part.                      |
| popup shell   | `NvAutocomplete`                | Portalled options surface      | Documented in Autocomplete README                                 | Reference linked spec if needed.           |
| option row    | `StSelectOption` / `NvOption`   | Selectable item row            | Fixed height, horizontal padding, ellipsis, state fills           | Separate row component set.                |
| trailing slot | `option__after`                 | Secondary affordance or meta   | Left margin `8px` between extra content items                     | Optional sub-slot.                         |

## Token Mapping

| Concern                    | Token                                  | Resolved value                       | Where used           |
| -------------------------- | -------------------------------------- | ------------------------------------ | -------------------- |
| trigger radii              | `tokens.borderRadius.sm/md/DEFAULT`    | `6px`, `8px`, `8px`                  | trigger by size      |
| trigger min heights        | `tokens.spacing[6..8]`                 | `24px`, `32px`, `40px`               | trigger by size      |
| trigger input heights      | `tokens.spacing[5..7]`                 | `20px`, `24px`, `32px`               | text input by size   |
| trigger horizontal padding | `tokens.spacing[3/5/6]` + icon reserve | `8/16/24px` left, `20/28/36px` right | trigger by size      |
| trigger vertical padding   | `tokens.spacing[2]`                    | `4px`                                | trigger by size      |
| trigger border width       | `tokens.borderWidth.DEFAULT`           | `1px`                                | trigger border       |
| focus ring spread          | `tokens.borderWidth.lg`                | `4px`                                | trigger focus ring   |
| option height              | `tokens.spacing[7]`                    | `32px`                               | option rows          |
| option horizontal padding  | `tokens.spacing[5]`                    | `16px`                               | option rows          |
| option trailing slot gap   | `tokens.spacing[3]`                    | `8px`                                | `.option__after > *` |

## Recommended Figma Mapping

| Figma property    | Type    | Suggested values                                          | Derived from                   |
| ----------------- | ------- | --------------------------------------------------------- | ------------------------------ |
| `Size`            | variant | `sm, md, lg`                                              | `size` prop                    |
| `Mode`            | variant | `single, multiple`                                        | `multiple` prop                |
| `Trigger State`   | variant | `rest, hover, focus`                                      | trigger styling                |
| `Theme`           | variant | `light, dark`                                             | theme files                    |
| `Has Selection`   | boolean | `true, false`                                             | selected values                |
| `Has Placeholder` | boolean | `true, false`                                             | placeholder text presence      |
| `Option State`    | variant | `rest, hover, active, selected, disabled, readonly-group` | `NvOption` and grouped options |
| `Option After`    | boolean | `true, false`                                             | `after` slot                   |

## Gaps / Assumptions

| Item                          | Status         | Notes                                                                               |
| ----------------------------- | -------------- | ----------------------------------------------------------------------------------- |
| `labelKey` story arg          | Found mismatch | Story passes `labelKey`, but there is no such prop in `select.shared.ts`.           |
| Option radius / separators    | Not found      | Rows use fills only; no local border or radius tokens.                              |
| Invalid / error trigger state | Unsupported    | No local styling for validation state.                                              |
| Disabled whole-select state   | Unsupported    | Option-level disabled exists; trigger-level disabled is not defined in this folder. |
