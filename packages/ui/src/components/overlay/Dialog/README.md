# NvDialog Design Spec

Purpose: centered modal dialog with backdrop, title, optional description, footer slot, and built-in close button.

Source files used:

- `NvDialog.vue`
- `dialog.shared.ts`
- `dialog.styled.ts`
- `dialog.stories.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@/styles/tokens`
- `packages/design-tokens/src/main.ts`
- `@/components/display/Card/*`

## Component Axes

| Property                  | Kind     | Values                         | Default                    | Notes                                                                                                 |
| ------------------------- | -------- | ------------------------------ | -------------------------- | ----------------------------------------------------------------------------------------------------- |
| `open`                    | boolean  | `true, false`                  | uncontrolled (`undefined`) | Supports controlled and uncontrolled open state. Controlled mode emits `update:open`.                 |
| `portalTarget`            | string   | CSS selector / teleport target | `'body'`                   | Used by Vue `Teleport`.                                                                               |
| `title`                   | slot     | content                        | Not found                  | Always rendered inside `NvText type="title"`; empty slot still leaves the title row and close button. |
| `description`             | slot     | content                        | optional                   | Only rendered when the slot exists.                                                                   |
| `footer`                  | slot     | content                        | optional                   | Rendered after description.                                                                           |
| `reference`               | slot     | content                        | required to open from UI   | Passed into `StDialogTrigger`.                                                                        |
| Default slot body         | slot     | content                        | Unsupported                | No default content slot is rendered.                                                                  |
| Dismiss by backdrop click | behavior | `true`                         | `true`                     | Clicking `StDialogContentWrapper` outside the card closes the dialog.                                 |

## Size Specification

| Size    | Height                  | Min width | Max width                 | Padding X             | Padding Y             | Gap                        | Radius               | Border width | Typography                                                                           | Icon size                                                                                       | Notes                                                             |
| ------- | ----------------------- | --------- | ------------------------- | --------------------- | --------------------- | -------------------------- | -------------------- | ------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| default | viewport height wrapper | Not found | `480px` content max width | `8px` wrapper padding | `8px` wrapper padding | `16px` inner stack spacing | `8px` on nested card | Not found    | Title typography delegated to `NvText type="title"`; description to default `NvText` | Close button icon comes from `NvButton` `icon-name="times"`; icon size not found in this folder | Visual surface comes from nested `NvCard` with default size `md`. |

## Variant And State Styles

| Theme | Variant | State         | Text color | Icon color | Background / fill                                                 | Border / stroke | Shadow / effects             | Radius               | Opacity      | Notes                                                                |
| ----- | ------- | ------------- | ---------- | ---------- | ----------------------------------------------------------------- | --------------- | ---------------------------- | -------------------- | ------------ | -------------------------------------------------------------------- |
| light | default | open backdrop | Not found  | N/A        | `rgba(theme.dialog.backdropColor, 0.95)` -> `rgba(#0E0E2C, 0.95)` | none            | None                         | `0px`                | `0.95`       | Backdrop covers full viewport with `z-index: 9999`.                  |
| dark  | default | open backdrop | Not found  | N/A        | `rgba(theme.dialog.backdropColor, 0.95)` -> `rgba(#2B2B2C, 0.95)` | none            | None                         | `0px`                | `0.95`       | Backdrop covers full viewport with `z-index: 9999`.                  |
| light | default | open content  | Not found  | N/A        | Delegated to nested `NvCard` / theme card background              | none            | Delegated to nested `NvCard` | `8px` on nested card | `1`          | Dialog shell itself does not style the card border.                  |
| dark  | default | open content  | Not found  | N/A        | Delegated to nested `NvCard` / theme card background              | none            | Delegated to nested `NvCard` | `8px` on nested card | `1`          | Dialog shell itself does not style the card border.                  |
| light | default | closed        | N/A        | N/A        | N/A                                                               | none            | N/A                          | N/A                  | `0` / hidden | Backdrop is removed with `v-if`; positioner is hidden with `v-show`. |
| dark  | default | closed        | N/A        | N/A        | N/A                                                               | none            | N/A                          | N/A                  | `0` / hidden | Backdrop is removed with `v-if`; positioner is hidden with `v-show`. |

## Structure / Anatomy

| Part            | Source of truth                         | Visual role                                 | Relevant styling                                                   | Export note                                                  |
| --------------- | --------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Root            | `StDialogRoot`                          | Ark dialog state container                  | No visual styles in this folder                                    | Non-visual state wrapper.                                    |
| Trigger         | `StDialogTrigger` + `reference` slot    | Opens dialog                                | No local visual styles                                             | Keep as separate trigger component in Figma.                 |
| Backdrop        | `StDialogBackdrop`                      | Modal scrim                                 | Full-screen absolute layer, `z-index: 9999`, theme-based rgba fill | Export as full-screen backdrop layer.                        |
| Positioner      | `StDialogPositioner`                    | Full-screen centering layer                 | Full-screen absolute layer, `z-index: 9999`                        | Non-visual centering frame.                                  |
| Content wrapper | `StDialogContentWrapper`                | Click-outside hit area and scroll container | Grid centering, full-screen size, `overflow: auto`, `padding: 8px` | Use as outer responsive frame around dialog card.            |
| Content shell   | `StDialogContent`                       | Width constraint                            | `width: 100%`, `max-width: 480px`                                  | This is the primary dialog width constraint.                 |
| Card surface    | nested `NvCard`                         | Visible dialog panel                        | Card styling delegated to `NvCard` default props                   | Reference card component rather than re-documenting it here. |
| Header row      | `NvGroup justify="between"`             | Title + close affordance                    | Horizontal layout with spaced ends                                 | Model as fixed header row.                                   |
| Title           | `StDialogTitle` + `NvText type="title"` | Primary heading                             | Typography delegated to `NvText`                                   | Title is always present structurally.                        |
| Description     | `StDialogDescription` + `NvText`        | Supporting copy                             | Conditional render only when slot exists                           | Boolean Figma property is appropriate.                       |
| Close button    | `StDialogCloseTrigger` + `NvButton`     | Dismiss action                              | `type="plain"`, `size="xs"`, `squared`, icon `times`               | Represent as persistent close affordance.                    |
| Footer          | `footer` slot                           | Actions area                                | Consumer-defined content                                           | Use as slot/content region rather than fixed subcomponent.   |

## Token Mapping

| Concern              | Token                                       | Resolved value                | Where used                                         |
| -------------------- | ------------------------------------------- | ----------------------------- | -------------------------------------------------- |
| Backdrop light color | `theme.dialog.backdropColor`                | `colors.gray.100` (`#0E0E2C`) | Light theme backdrop base color                    |
| Backdrop dark color  | `theme.dialog.backdropColor`                | `colors.gray.90` (`#2B2B2C`)  | Dark theme backdrop base color                     |
| Backdrop opacity     | `theme.dialog.backdropOpacity`              | `0.95`                        | Both themes backdrop alpha                         |
| Wrapper padding      | `tokens.spacing.3`                          | `8px`                         | `StDialogContentWrapper` padding                   |
| Content max width    | hard-coded                                  | `480px`                       | `StDialogContent`                                  |
| Inner content gap    | `NvStack spacing="5"` -> `tokens.spacing.5` | `16px`                        | Spacing between title row, description, and footer |
| Nested card radius   | `tokens.borderRadius.DEFAULT` via `NvCard`  | `8px`                         | Visible dialog surface                             |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values | Derived from                                         |
| -------------- | ------- | ---------------- | ---------------------------------------------------- |
| `Theme`        | Variant | `light, dark`    | Theme-specific backdrop values and nested card theme |
| `State`        | Variant | `open, closed`   | `open` prop / local state                            |
| `Description`  | Boolean | `true, false`    | Conditional description slot                         |
| `Footer`       | Boolean | `true, false`    | Optional footer slot                                 |
| `Close Button` | Boolean | `true`           | Always rendered in implementation                    |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Topic                                       | Status                   | Notes                                                                                                                            |
| ------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Body content slot                           | Unsupported              | The component has no default slot for body copy beyond `description` and `footer`.                                               |
| Card surface tokens                         | Partially delegated      | The dialog shell defines layout and backdrop, but visible panel colors, border, and shadow come from `NvCard`.                   |
| Typography values                           | Not found in this folder | Title and description styles come from `NvText`, not local styles.                                                               |
| Escape-key / focus-trap behavior            | Not documented here      | Ark dialog primitives may provide behavior, but this folder does not define or override it explicitly.                           |
| `theme.dialog.contentBackgroundColor` usage | Ambiguous                | Theme exposes this token, but this folder does not consume it directly; the nested card determines the visible panel background. |
