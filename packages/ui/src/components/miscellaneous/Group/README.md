# NvGroup Design Spec

- Purpose: arrange children in a flex row or column with configurable spacing, wrapping, alignment, and optional child growth.
- Source files used: `NvGroup.vue`, `group.shared.ts`, `group.styled.ts`, `group.stories.ts`

## Component Axes

| Property     | Kind              | Values                                       | Default   | Notes                                                                                                    |
| ------------ | ----------------- | -------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------- |
| `direction`  | enum              | `row`, `column`                              | `row`     | Controls main layout axis.                                                                               |
| `spacing`    | numeric token key | `1`-`16` in Storybook                        | `3`       | Maps to `gap` using `tokens.spacing`.                                                                    |
| `justify`    | enum              | `left`, `center`, `right`, `apart`, `around` | `left`    | In `row`, maps to `justify-content`; in `column`, it affects `align-items` instead.                      |
| `align`      | enum              | `stretch`, `center`, `start`, `end`          | `center`  | Used only when `direction === 'row'`.                                                                    |
| `noWrap`     | boolean           | `true`, `false`                              | `false`   | Switches flex wrap from `wrap` to `nowrap`.                                                              |
| `grow`       | boolean           | `true`, `false`                              | `false`   | Makes direct children `flex-grow: 1`; when `direction === 'column'`, also forces `align-items: stretch`. |
| `as`         | element selector  | Any HTML tag string                          | `div`     | Changes rendered tag only.                                                                               |
| content mode | slot              | Arbitrary child content                      | Not found | Single default slot.                                                                                     |

## Size Specification

| Size / Spacing | Height                 | Min width              | Padding X | Padding Y | Gap   | Radius | Border width | Typography | Icon size | Notes               |
| -------------- | ---------------------- | ---------------------- | --------- | --------- | ----- | ------ | ------------ | ---------- | --------- | ------------------- |
| `spacing=1`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 2px   | N/A    | 0            | N/A        | N/A       | `tokens.spacing.1`  |
| `spacing=2`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 4px   | N/A    | 0            | N/A        | N/A       | `tokens.spacing.2`  |
| `spacing=3`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 8px   | N/A    | 0            | N/A        | N/A       | Prop default        |
| `spacing=4`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 12px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.4`  |
| `spacing=5`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 16px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.5`  |
| `spacing=6`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 24px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.6`  |
| `spacing=7`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 32px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.7`  |
| `spacing=8`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 40px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.8`  |
| `spacing=9`    | Parent/content-defined | Parent/content-defined | 0         | 0         | 48px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.9`  |
| `spacing=10`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 64px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.10` |
| `spacing=11`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 80px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.11` |
| `spacing=12`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 96px  | N/A    | 0            | N/A        | N/A       | `tokens.spacing.12` |
| `spacing=13`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 112px | N/A    | 0            | N/A        | N/A       | `tokens.spacing.13` |
| `spacing=14`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 128px | N/A    | 0            | N/A        | N/A       | `tokens.spacing.14` |
| `spacing=15`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 144px | N/A    | 0            | N/A        | N/A       | `tokens.spacing.15` |
| `spacing=16`   | Parent/content-defined | Parent/content-defined | 0         | 0         | 160px | N/A    | 0            | N/A        | N/A       | `tokens.spacing.16` |

## Variant And State Styles

| Theme | Variant | State | Text color | Background color | Border color | Border width | Shadow / focus ring | Radius | Opacity | Notes                                 |
| ----- | ------- | ----- | ---------- | ---------------- | ------------ | ------------ | ------------------- | ------ | ------- | ------------------------------------- |
| Light | any     | Rest  | Inherited  | None             | None         | 0            | None                | N/A    | 1       | Theme does not alter layout behavior. |
| Dark  | any     | Rest  | Inherited  | None             | None         | 0            | None                | N/A    | 1       | Theme does not alter layout behavior. |

## Structure / Anatomy

| Part                | Source of truth   | Visual role                    | Relevant styling                                                                   | Export note                                                                     |
| ------------------- | ----------------- | ------------------------------ | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| root flex container | `group.styled.ts` | Wraps and distributes children | `display: flex`, `flex-flow`, `gap`, conditional `justify-content` / `align-items` | Figma equivalent is an auto-layout frame with optional wrap and adjustable gap. |
| direct children     | `group.styled.ts` | Participating items            | `& > * { flex-grow: 1 }` when `grow` is true                                       | If `grow` is enabled, use fill-container behavior for immediate children.       |

## Token Mapping

| Concern       | Token                                  | Resolved value                                                                                                                  | Where used                 |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| spacing scale | `tokens.spacing.1`-`tokens.spacing.16` | `2px`, `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px`, `96px`, `112px`, `128px`, `144px`, `160px` | `gap` in `group.styled.ts` |

## Recommended Figma Mapping

| Figma property  | Type    | Suggested values                                        | Derived from        |
| --------------- | ------- | ------------------------------------------------------- | ------------------- |
| `Direction`     | Variant | `row, column`                                           | `direction` prop    |
| `Spacing`       | Variant | `1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16` | `spacing` prop      |
| `Justify`       | Variant | `left, center, right, apart, around`                    | `justify` prop      |
| `Align`         | Variant | `stretch, center, start, end`                           | `align` prop        |
| `Wrap`          | Boolean | `true, false`                                           | Inverse of `noWrap` |
| `Grow Children` | Boolean | `true, false`                                           | `grow` prop         |

## Gaps / Assumptions

| Item                   | Status      | Notes                                                                                                                                   |
| ---------------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Column-axis semantics  | Ambiguous   | When `direction === 'column'`, `justify` affects `align-items`, and `justify-content` is not set. This differs from the `row` behavior. |
| `align` mapping in row | Ambiguous   | `align-items` receives raw values like `start` and `end` instead of normalized `flex-start` / `flex-end`.                               |
| Theme differences      | Unsupported | No theme-specific styling is implemented in this folder.                                                                                |
| Interactive states     | Unsupported | No hover, focus, active, disabled, or selected styling.                                                                                 |
