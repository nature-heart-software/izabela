# NvPopover Design Spec

Purpose: anchored popover surface rendered in a portal with selectable content padding size.

Source files used:

- `NvPopover.vue`
- `popover.shared.ts`
- `popover.styled.ts`
- `popover.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@/styles/tokens`
- `packages/design-tokens/src/main.ts`
- `@/components/display/Card/*`

## Component Axes

| Property           | Kind     | Values                               | Default                  | Notes                                                                    |
| ------------------ | -------- | ------------------------------------ | ------------------------ | ------------------------------------------------------------------------ |
| `placement`        | enum     | `ComputePositionConfig['placement']` | `'bottom-end'`           | Forwarded into Ark positioning config.                                   |
| `size`             | enum     | `sm, md, lg`                         | `md`                     | Controls surface padding and radius theme name (`popover-${size}`).      |
| `reference`        | slot     | content                              | required to open from UI | Rendered inside `Popover.Trigger`.                                       |
| Default slot       | slot     | content                              | optional                 | Rendered inside nested `NvCard`.                                         |
| Open state         | behavior | `true, false`                        | local only               | Internal `ref(false)`; no public `open` prop.                            |
| Modal click shield | behavior | `true`                               | `true`                   | Fixed full-screen div is shown while open and intercepts pointer events. |

## Size Specification

| Size | Height         | Min width | Max width | Padding X | Padding Y | Gap       | Radius | Border width | Typography | Icon size | Notes                                                                                                     |
| ---- | -------------- | --------- | --------- | --------- | --------- | --------- | ------ | ------------ | ---------- | --------- | --------------------------------------------------------------------------------------------------------- |
| `sm` | content-driven | Not found | `300px`   | `8px`     | `8px`     | Not found | `6px`  | `1px`        | Not found  | N/A       | Surface is a nested `NvCard` with additional popover theme styles applied by `[data-theme="popover-sm"]`. |
| `md` | content-driven | Not found | `300px`   | `16px`    | `16px`    | Not found | `8px`  | `1px`        | Not found  | N/A       | Default size.                                                                                             |
| `lg` | content-driven | Not found | `300px`   | `16px`    | `16px`    | Not found | `8px`  | `1px`        | Not found  | N/A       | `lg` currently matches `md` for documented local padding and radius.                                      |

## Variant And State Styles

| Theme | Variant | State     | Text color | Icon color | Background / fill                                                   | Border / stroke                                                     | Shadow / effects                                            | Radius | Opacity      | Notes                                                              |
| ----- | ------- | --------- | ---------- | ---------- | ------------------------------------------------------------------- | ------------------------------------------------------------------- | ----------------------------------------------------------- | ------ | ------------ | ------------------------------------------------------------------ |
| light | `sm`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `colors.white` (`#ffffff`)       | `1px` / `theme.popover.borderColor` -> `colors.gray.20` (`#EBEBEB`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `6px`  | `1`          | No separate hover/focus/active surface styles defined.             |
| light | `md`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `colors.white` (`#ffffff`)       | `1px` / `theme.popover.borderColor` -> `colors.gray.20` (`#EBEBEB`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`  | `1`          | Default size.                                                      |
| light | `lg`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `colors.white` (`#ffffff`)       | `1px` / `theme.popover.borderColor` -> `colors.gray.20` (`#EBEBEB`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`  | `1`          | `lg` shares local surface styling with `md` except the theme name. |
| dark  | `sm`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `darken(0.0675, colors.gray.80)` | `1px` / `theme.popover.borderColor` -> `colors.gray.80` (`#444444`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `6px`  | `1`          | Dark background is computed in theme code.                         |
| dark  | `md`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `darken(0.0675, colors.gray.80)` | `1px` / `theme.popover.borderColor` -> `colors.gray.80` (`#444444`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`  | `1`          | Default size.                                                      |
| dark  | `lg`    | rest/open | Not found  | N/A        | `theme.popover.backgroundColor` -> `darken(0.0675, colors.gray.80)` | `1px` / `theme.popover.borderColor` -> `colors.gray.80` (`#444444`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`  | `1`          | `lg` shares local surface styling with `md` except the theme name. |
| light | any     | closed    | N/A        | N/A        | N/A                                                                 | none                                                                | N/A                                                         | N/A    | `0` / hidden | Card is gated by `v-if="open"`.                                    |
| dark  | any     | closed    | N/A        | N/A        | N/A                                                                 | none                                                                | N/A                                                         | N/A    | `0` / hidden | Card is gated by `v-if="open"`.                                    |

## Structure / Anatomy

| Part         | Source of truth                      | Visual role                          | Relevant styling                                                          | Export note                                                  |
| ------------ | ------------------------------------ | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Root         | `Popover.Root`                       | Open state and positioning context   | `autoFocus=false`, `portalled`, `asChild`                                 | Non-visual wrapper.                                          |
| Trigger      | `Popover.Trigger` + `reference` slot | Anchor element                       | No local visual styling                                                   | Model separately from surface.                               |
| Click shield | fixed `div` in teleport              | Intercepts pointer events while open | Full-screen fixed layer, `z-index: 9999`                                  | Include as invisible interaction layer if modeling behavior. |
| Positioner   | `Popover.Positioner`                 | Anchored placement container         | `z-index: 9999`                                                           | Non-visual position frame.                                   |
| Content      | `Popover.Content`                    | Popover content host                 | Always present while mounted; child card handles visible surface          | Non-visual shell unless exporting behavior details.          |
| Surface      | nested `NvCard`                      | Visible popover panel                | `max-width: 300px`, size-driven padding/radius theme, token border/shadow | Primary Figma export target.                                 |
| Body content | default slot                         | Consumer-defined content             | No local typography or layout rules                                       | Treat as content slot region.                                |

## Token Mapping

| Concern                  | Token                                                            | Resolved value                            | Where used                         |
| ------------------------ | ---------------------------------------------------------------- | ----------------------------------------- | ---------------------------------- |
| Placement offset         | `tokens.spacing.4`                                               | `12px`                                    | Floating `mainAxis` offset         |
| Overflow padding         | `tokens.spacing.3`                                               | `8px`                                     | Floating viewport overflow padding |
| Surface shadow           | `tokens.boxShadow.lg`                                            | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | Popover surface box shadow         |
| Surface border width     | `tokens.borderWidth.DEFAULT`                                     | `1px`                                     | Popover surface border width       |
| `sm` padding             | `paddingStyleBySize('sm')` -> `tokens.spacing.3`                 | `8px` on all sides                        | `size="sm"` surface padding        |
| `md` padding             | `paddingStyleBySize('md')` -> `tokens.spacing.5`                 | `16px` on all sides                       | `size="md"` surface padding        |
| `lg` padding             | `paddingStyleBySize('lg')` -> `tokens.spacing.5`                 | `16px` on all sides                       | `size="lg"` surface padding        |
| `sm` radius              | `borderRadiusStyleBySize('sm')` -> `tokens.borderRadius.sm`      | `6px`                                     | `size="sm"` surface radius         |
| `md` radius              | `borderRadiusStyleBySize('md')` -> `tokens.borderRadius.md`      | `8px`                                     | `size="md"` surface radius         |
| `lg` radius              | `borderRadiusStyleBySize('lg')` -> `tokens.borderRadius.DEFAULT` | `8px`                                     | `size="lg"` surface radius         |
| Light surface background | `theme.popover.backgroundColor`                                  | `colors.white` (`#ffffff`)                | Light theme surface fill           |
| Light surface border     | `theme.popover.borderColor`                                      | `colors.gray.20` (`#EBEBEB`)              | Light theme border                 |
| Dark surface background  | `theme.popover.backgroundColor`                                  | `darken(0.0675, colors.gray.80)`          | Dark theme surface fill            |
| Dark surface border      | `theme.popover.borderColor`                                      | `colors.gray.80` (`#444444`)              | Dark theme border                  |

## Recommended Figma Mapping

| Figma property | Type                           | Suggested values                      | Derived from                 |
| -------------- | ------------------------------ | ------------------------------------- | ---------------------------- |
| `Theme`        | Variant                        | `light, dark`                         | Theme object branches        |
| `Size`         | Variant                        | `sm, md, lg`                          | `size` prop                  |
| `State`        | Variant                        | `open, closed`                        | Internal `open` state        |
| `Placement`    | Variant or documentation field | `top, top-start, top-end, right, ...` | `placement` prop passthrough |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Topic                            | Status             | Notes                                                                                                                          |
| -------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Typography                       | Not found          | This folder does not define any text styles for popover contents.                                                              |
| Min width                        | Not found          | Only `max-width: 300px` is specified locally.                                                                                  |
| Size delta between `md` and `lg` | Confirmed limited  | In this folder, `md` and `lg` resolve to the same local padding and radius values.                                             |
| Dismiss behavior details         | Partially implicit | The component uses Ark Popover plus a full-screen click shield, but close-on-outside-click specifics are not restated locally. |
