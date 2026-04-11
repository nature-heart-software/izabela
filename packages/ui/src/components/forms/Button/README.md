# NvButton

General-purpose button with five visual types, four sizes, optional trailing icon, loading overlay, and an auto-square icon-only mode.

## Source Files Used

- `NvButton.vue`
- `button.shared.ts`
- `button.styled.ts`
- `button.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property           | Kind         | Values                                             | Default   | Notes                                                     |
| ------------------ | ------------ | -------------------------------------------------- | --------- | --------------------------------------------------------- |
| `type`             | enum         | `default`, `plain`, `ghost`, `ghost-alt`, `active` | `default` | Primary visual axis.                                      |
| `size`             | enum         | `xs`, `sm`, `md`, `lg`                             | `md`      | Controls height, radius, padding, typography, icon size.  |
| `selected`         | boolean      | `true`, `false`                                    | `false`   | Adds variant-specific selected styling.                   |
| `squared`          | boolean      | `true`, `false`                                    | `false`   | Forces equal width/height and removes horizontal padding. |
| `iconName`         | string       | any icon name                                      | `''`      | Renders a trailing `NvIcon`.                              |
| `loading`          | boolean      | `true`, `false`                                    | `false`   | Applies Element Plus loading directive.                   |
| content slot empty | content mode | `text`, `icon-only`                                | text      | Empty default slot forces `squared = true`.               |
| `align`            | enum-ish     | CSS `text-align` values                            | `''`      | Applied as `justify-content`.                             |

## Size Specification

| Size | Height | Min width | Padding X                         | Padding Y | Gap       | Radius | Border width                              | Typography                                                                | Icon size                    | Notes                  |
| ---- | ------ | --------- | --------------------------------- | --------- | --------- | ------ | ----------------------------------------- | ------------------------------------------------------------------------- | ---------------------------- | ---------------------- |
| `xs` | `20px` | Not found | `4px` or `4px / 12px` with icon   | `0`       | Not found | `4px`  | `1px` normally, `2px` for `type='active'` | `tokens.fontSize[1]` = `12px`, line-height `1.4`, letter-spacing `0.32px` | `tokens.spacing[1]` = `2px`  | Square width = `20px`. |
| `sm` | `24px` | Not found | `8px` or `8px / 20px` with icon   | `0`       | Not found | `6px`  | `1px` normally, `2px` for `active`        | `12px`, `1.4`, `0.32px`                                                   | `tokens.spacing[3]` = `8px`  | Square width = `24px`. |
| `md` | `32px` | Not found | `16px` or `16px / 28px` with icon | `0`       | Not found | `8px`  | `1px` normally, `2px` for `active`        | `12px`, `1.4`, `0.32px`                                                   | `tokens.spacing[5]` = `16px` | Square width = `32px`. |
| `lg` | `40px` | Not found | `16px` or `24px / 36px` with icon | `0`       | Not found | `8px`  | `1px` normally, `2px` for `active`        | `tokens.fontSize[2]` = `14px`, line-height `1.4`, letter-spacing `0.32px` | `tokens.spacing[5]` = `16px` | Square width = `40px`. |

## Variant And State Style Tables

| Theme      | Variant     | State    | Text color                                | Background color                              | Border color                              | Border width | Shadow / focus ring                | Radius  | Opacity | Notes                                                                                           |
| ---------- | ----------- | -------- | ----------------------------------------- | --------------------------------------------- | ----------------------------------------- | ------------ | ---------------------------------- | ------- | ------- | ----------------------------------------------------------------------------------------------- |
| light      | `default`   | rest     | `#444444`                                 | `#ffffff`                                     | `#EBEBEB`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `default`   | hover    | `#444444`                                 | `#F9F9FC`                                     | `#EBEBEB`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `default`   | active   | `#444444`                                 | `#BEBEBE`                                     | `#EBEBEB`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `default`   | focus    | `#444444`                                 | `#ffffff`                                     | `#EBEBEB`                                 | `1px`        | `0 0 0 4px #F9F9FC`                | by size | `1`     |                                                                                                 |
| light      | `default`   | selected | `#444444`                                 | `#EBEBEB`                                     | `#EBEBEB`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `default`   | rest     | `#DCDCDC`                                 | `darken(0.0675, #444444)`                     | `#444444`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `default`   | hover    | `#DCDCDC`                                 | `#444444`                                     | `#444444`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `default`   | active   | `#DCDCDC`                                 | `#2B2B2C`                                     | `#444444`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `default`   | focus    | `#DCDCDC`                                 | `darken(0.0675, #444444)`                     | `#444444`                                 | `1px`        | `0 0 0 4px #444444`                | by size | `1`     |                                                                                                 |
| dark       | `default`   | selected | `#DCDCDC`                                 | `darken(0.0675, #626262)`                     | `#444444`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `plain`     | rest     | `#ffffff`                                 | `#0E0E2C`                                     | `#0E0E2C`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `plain`     | hover    | `#ffffff`                                 | `#2B2B2C`                                     | `#2B2B2C`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `plain`     | active   | `#ffffff`                                 | `#626262`                                     | `#626262`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light      | `plain`     | focus    | `#ffffff`                                 | `#0E0E2C`                                     | `#0E0E2C`                                 | `1px`        | `0 0 0 4px #626262`                | by size | `1`     |                                                                                                 |
| light      | `plain`     | selected | `#ffffff`                                 | `#444444`                                     | `#444444`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `plain`     | rest     | `#444444`                                 | `lighten(0.05, #9F9F9F)`                      | `lighten(0.05, #9F9F9F)`                  | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `plain`     | hover    | `#444444`                                 | `#BEBEBE`                                     | `#BEBEBE`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `plain`     | active   | `#444444`                                 | `#9F9F9F`                                     | `#9F9F9F`                                 | `1px`        | none                               | by size | `1`     |                                                                                                 |
| dark       | `plain`     | focus    | `#444444`                                 | `lighten(0.05, #9F9F9F)`                      | `lighten(0.05, #9F9F9F)`                  | `1px`        | `0 0 0 4px lighten(0.05, #9F9F9F)` | by size | `1`     |                                                                                                 |
| dark       | `plain`     | selected | `#444444`                                 | `lighten(0.05, #9F9F9F)`                      | `lighten(0.05, #9F9F9F)`                  | `1px`        | none                               | by size | `1`     |                                                                                                 |
| light/dark | `ghost`     | rest     | same as theme `button.ghost.color`        | `transparent`                                 | `transparent`                             | `1px`        | none                               | by size | `1`     | Hover, active, focus, selected only change background / focus ring.                             |
| light/dark | `ghost-alt` | rest     | same as theme `button['ghost-alt'].color` | `transparent`                                 | `transparent`                             | `1px`        | none                               | by size | `1`     | Selected adds `tokens.boxShadow.DEFAULT` plus background.                                       |
| light/dark | `active`    | rest     | same as theme `button.active.color`       | same as theme `button.active.backgroundColor` | same as theme `button.active.borderColor` | `2px`        | none                               | by size | `1`     | Same state model as `default`, but always 2px border and border color from plain variant token. |

## Structure / Anatomy

| Part            | Source of truth          | Visual role              | Relevant styling                                                 | Export note                                                |
| --------------- | ------------------------ | ------------------------ | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| root button     | `StButton`               | Interactive container    | Height, padding, border, radius, typography, variant styles      | Main component frame.                                      |
| content span    | `NvButton.vue`           | Label container          | Hidden entirely when slot is empty                               | Use text slot / optional text layer.                       |
| trailing icon   | `.nv-button__icon`       | Optional icon affordance | Absolute-positioned unless squared; right offset depends on size | Separate boolean property in Figma.                        |
| loading overlay | Element Plus `v-loading` | Busy state overlay       | Visual details not defined in this folder                        | Treat as documented behavior, not a source-authored style. |

## Token Mapping

| Concern          | Token                                                         | Resolved value                            | Where used               |
| ---------------- | ------------------------------------------------------------- | ----------------------------------------- | ------------------------ |
| font family      | `tokens.fontFamily.sans`                                      | `Nunito, system-ui, ...`                  | inherited text rendering |
| border width     | `tokens.borderWidth.DEFAULT`                                  | `1px`                                     | all non-`active` buttons |
| focus ring width | `tokens.borderWidth.lg`                                       | `4px`                                     | focus box-shadow spread  |
| shadow           | `tokens.boxShadow.DEFAULT`                                    | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `ghost-alt` selected     |
| transition       | `tokens.transition.DEFAULT`                                   | `all .3s`                                 | root button and icon     |
| heights          | `tokens.spacing[5..8]`                                        | `20px`, `24px`, `32px`, `40px`            | size scale               |
| icon sizes       | `tokens.spacing[1]`, `tokens.spacing[3]`, `tokens.spacing[5]` | `2px`, `8px`, `16px`                      | `NvIcon` size prop       |
| radii            | `tokens.borderRadius.xs/sm/md/DEFAULT`                        | `4px`, `6px`, `8px`, `8px`                | size scale               |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                                | Derived from                           |
| -------------- | ------- | ----------------------------------------------- | -------------------------------------- |
| `Variant`      | variant | `default, plain, ghost, ghost-alt, active`      | `type` prop                            |
| `Size`         | variant | `xs, sm, md, lg`                                | `size` prop                            |
| `State`        | variant | `rest, hover, active, focus, selected, loading` | pseudo states + `selected` + `loading` |
| `Theme`        | variant | `light, dark`                                   | theme files                            |
| `Icon`         | boolean | `true, false`                                   | `iconName` prop                        |
| `Icon Only`    | boolean | `true, false`                                   | empty slot forces square mode          |
| `Squared`      | boolean | `true, false`                                   | `squared` prop                         |

## Gaps / Assumptions

| Item                    | Status                  | Notes                                                                                                      |
| ----------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| Disabled styling        | Not found / unsupported | Theme files define `button.*.disabled`, but component has no `disabled` prop or CSS branch in this folder. |
| Loading visuals         | Not found in source     | Busy visuals come from Element Plus directive, not component-local styles.                                 |
| Content-to-icon spacing | Indirect                | Implemented by padding and absolute icon placement, not a separate gap token.                              |
