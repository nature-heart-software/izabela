# NvStack Design Spec

- Purpose: arrange children in a vertical flex stack with configurable spacing, alignment, and distribution.
- Source files used: `NvStack.vue`, `stack.shared.ts`, `stack.styled.ts`, `stack.stories.ts`

## Component Axes

| Property     | Kind              | Values                                       | Default   | Notes                                                                             |
| ------------ | ----------------- | -------------------------------------------- | --------- | --------------------------------------------------------------------------------- |
| `spacing`    | numeric token key | `1`-`16` in Storybook                        | `3`       | Maps to `gap` using `tokens.spacing`.                                             |
| `align`      | enum              | `start`, `center`, `end`, `stretch`          | `stretch` | Maps to `align-items` via the local `POSITIONS` table.                            |
| `justify`    | enum              | `left`, `center`, `right`, `apart`, `around` | `left`    | Maps to `justify-content`; `left` behaves as `flex-start`, `right` as `flex-end`. |
| `as`         | element selector  | Any HTML tag string                          | `div`     | Changes rendered tag only.                                                        |
| content mode | slot              | Arbitrary child content                      | Not found | Single default slot.                                                              |

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

| Part                | Source of truth   | Visual role                | Relevant styling                                                                   | Export note                                             |
| ------------------- | ----------------- | -------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| root flex container | `stack.styled.ts` | Vertical auto layout frame | `display: flex`, `flex-direction: column`, `justify-content`, `align-items`, `gap` | Figma equivalent is a vertical auto-layout frame.       |
| slotted children    | `NvStack.vue`     | Participating stack items  | No child-specific styling                                                          | Child sizing comes from content and parent constraints. |

## Token Mapping

| Concern       | Token                                  | Resolved value                                                                                                                  | Where used                 |
| ------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| spacing scale | `tokens.spacing.1`-`tokens.spacing.16` | `2px`, `4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `40px`, `48px`, `64px`, `80px`, `96px`, `112px`, `128px`, `144px`, `160px` | `gap` in `stack.styled.ts` |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values                                        | Derived from   |
| -------------- | ------- | ------------------------------------------------------- | -------------- |
| `Spacing`      | Variant | `1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16` | `spacing` prop |
| `Align`        | Variant | `start, center, end, stretch`                           | `align` prop   |
| `Justify`      | Variant | `left, center, right, apart, around`                    | `justify` prop |

## Gaps / Assumptions

| Item                       | Status      | Notes                                                                                                                               |
| -------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Naming of `justify` values | Ambiguous   | The prop uses `left` / `right` labels even though the component is always vertical. Runtime maps them to `flex-start` / `flex-end`. |
| Theme differences          | Unsupported | No theme-specific styling is implemented in this folder.                                                                            |
| Interactive states         | Unsupported | No hover, focus, active, disabled, or selected styling.                                                                             |
