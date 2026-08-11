# NvDivider Design Spec

- Purpose: render a 1px separator line in either horizontal or vertical orientation using the theme divider border color.
- Source files used: `NvDivider.vue`, `divider.shared.ts`, `divider.styled.ts`, `divider.stories.ts`

## Component Axes

| Property    | Kind         | Values                   | Default    | Notes                                                                 |
| ----------- | ------------ | ------------------------ | ---------- | --------------------------------------------------------------------- |
| `direction` | enum         | `vertical`, `horizontal` | `vertical` | Changes whether the component renders a right border or a top border. |
| state       | visual state | Rest only                | Rest       | No interactive states are implemented.                                |

## Size Specification

| Size         | Height                 | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography | Icon size | Notes                                                                                       |
| ------------ | ---------------------- | --------- | --------- | --------- | --- | ------ | ------------ | ---------- | --------- | ------------------------------------------------------------------------------------------- |
| `horizontal` | Parent/content-defined | 0         | 0         | 0         | N/A | N/A    | 1px          | N/A        | N/A       | Uses `border-top`. Width must come from parent layout.                                      |
| `vertical`   | Parent/content-defined | 0         | 0         | 0         | N/A | N/A    | 1px          | N/A        | N/A       | Uses `border-right`; also sets `display: inline-flex`. Height must come from parent layout. |

## Variant And State Styles

| Theme | Variant      | State | Text color | Icon color | Background / fill | Border / stroke                                                  | Shadow / effects | Radius | Opacity | Notes                                           |
| ----- | ------------ | ----- | ---------- | ---------- | ----------------- | ---------------------------------------------------------------- | ---------------- | ------ | ------- | ----------------------------------------------- |
| Light | `horizontal` | Rest  | N/A        | N/A        | None              | 1px / `theme.divider.borderColor` = `colors.gray.20` (`#EBEBEB`) | None             | N/A    | 1       | Renders `border-top`.                           |
| Light | `vertical`   | Rest  | N/A        | N/A        | None              | 1px / `theme.divider.borderColor` = `colors.gray.20` (`#EBEBEB`) | None             | N/A    | 1       | Renders `border-right`; `display: inline-flex`. |
| Dark  | `horizontal` | Rest  | N/A        | N/A        | None              | 1px / `theme.divider.borderColor` = `colors.gray.80` (`#444444`) | None             | N/A    | 1       | Renders `border-top`.                           |
| Dark  | `vertical`   | Rest  | N/A        | N/A        | None              | 1px / `theme.divider.borderColor` = `colors.gray.80` (`#444444`) | None             | N/A    | 1       | Renders `border-right`; `display: inline-flex`. |

## Structure / Anatomy

| Part         | Source of truth     | Visual role           | Relevant styling                      | Export note                                                                   |
| ------------ | ------------------- | --------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| divider line | `divider.styled.ts` | The separator stroke  | 1px solid border on top or right edge | In Figma, model as a line or 1px frame stroke rather than a filled rectangle. |
| root wrapper | `NvDivider.vue`     | Empty structural host | No content, no slot                   | Keep as a simple non-slotted primitive.                                       |

## Token Mapping

| Concern             | Token                       | Resolved value               | Where used               |
| ------------------- | --------------------------- | ---------------------------- | ------------------------ |
| border width        | Hard-coded `rem(1)`         | 1px                          | Divider border thickness |
| light divider color | `theme.divider.borderColor` | `colors.gray.20` (`#EBEBEB`) | Light theme border color |
| dark divider color  | `theme.divider.borderColor` | `colors.gray.80` (`#444444`) | Dark theme border color  |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values       | Derived from        |
| -------------- | ------- | ---------------------- | ------------------- |
| `Direction`    | Variant | `horizontal, vertical` | `direction` prop    |
| `Theme`        | Variant | `light, dark`          | Theme divider color |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                          | Status      | Notes                                                                 |
| ----------------------------- | ----------- | --------------------------------------------------------------------- |
| Prop default vs story default | Ambiguous   | Prop default is `vertical`, Storybook arg default is `horizontal`.    |
| Intrinsic length              | Not found   | Width / height must be supplied by layout context or utility classes. |
| Interactive states            | Unsupported | No hover, focus, active, selected, or disabled states.                |
