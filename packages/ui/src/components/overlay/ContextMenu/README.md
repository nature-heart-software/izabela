# NvContextMenu Design Spec

Purpose: click-triggered contextual action menu built on `vue-tippy`.

Source files used:

- `NvContextMenu.vue`
- `context-menu.shared.ts`
- `context-menu.styled.ts`
- `context-menu.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@/styles/tokens`
- `packages/design-tokens/src/main.ts`

## Component Axes

| Property          | Kind         | Values                                              | Default        | Notes                                                                                                                       |
| ----------------- | ------------ | --------------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `options`         | array        | `option[]` where each item is `option` or `divider` | `[]`           | `option` supports `label`, `icon`, `disabled`, `onClick`; `divider` supports `type: 'divider'`.                             |
| `tippyOptions`    | object       | `TippyOptions` passthrough                          | `{}`           | Merged after component defaults, so consumers can override trigger, placement, offset, max width, and other tippy behavior. |
| Trigger content   | slot         | default slot                                        | Not found      | Implementation renders `<slot />` inside `<tippy>`, so the default slot is the trigger content.                             |
| Reference slot    | slot         | `reference`                                         | Unsupported    | Storybook uses `#reference`, but the component does not render that slot.                                                   |
| Menu content mode | content mode | generated from `options` prop                       | `options` prop | Slotted menu items are not rendered by this component.                                                                      |

## Size Specification

| Size    | Height    | Min width | Max width | Padding X | Padding Y | Gap | Radius             | Border width | Typography | Icon size           | Notes                                                                                                                                           |
| ------- | --------- | --------- | --------- | --------- | --------- | --- | ------------------ | ------------ | ---------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| default | Not found | `150px`   | `300px`   | Not found | Not found | N/A | `md` token (`8px`) | `1px`        | Not found  | `3` (`NvIcon` prop) | Surface width is set by global tippy theme plus `maxWidth: 300` in component defaults. Item padding and row height are delegated to `NvOption`. |

## Variant And State Styles

| Theme | Variant | State         | Text color | Icon color | Background / fill                                                       | Border / stroke                                                         | Shadow / effects                                            | Radius    | Opacity   | Notes                                                                                                   |
| ----- | ------- | ------------- | ---------- | ---------- | ----------------------------------------------------------------------- | ----------------------------------------------------------------------- | ----------------------------------------------------------- | --------- | --------- | ------------------------------------------------------------------------------------------------------- |
| light | default | rest          | Not found  | N/A        | `theme.contextMenu.backgroundColor` -> `colors.white` (`#ffffff`)       | `1px` / `theme.contextMenu.borderColor` -> `colors.gray.20` (`#EBEBEB`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`     | Not found | Applied via `[data-theme="context-menu"]`.                                                              |
| dark  | default | rest          | Not found  | N/A        | `theme.contextMenu.backgroundColor` -> `darken(0.0675, colors.gray.80)` | `1px` / `theme.contextMenu.borderColor` -> `colors.gray.80` (`#444444`) | `boxShadow.lg` -> `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | `8px`     | Not found | Dark background is computed in theme code, not stored as a literal token.                               |
| light | default | open          | Not found  | N/A        | Same as rest                                                            | `1px` / Same as rest                                                    | Same as rest                                                | `8px`     | Not found | Open state is driven by tippy visibility; no separate open styling is defined.                          |
| dark  | default | open          | Not found  | N/A        | Same as rest                                                            | `1px` / Same as rest                                                    | Same as rest                                                | `8px`     | Not found | Open state is driven by tippy visibility; no separate open styling is defined.                          |
| light | default | disabled item | Not found  | N/A        | Not found                                                               | none                                                                    | Not found                                                   | Not found | Not found | Disabled behavior is passed to nested `NvOption`; container-level disabled styles are not defined here. |
| dark  | default | disabled item | Not found  | N/A        | Not found                                                               | none                                                                    | Not found                                                   | Not found | Not found | Disabled behavior is passed to nested `NvOption`; container-level disabled styles are not defined here. |

## Structure / Anatomy

| Part         | Source of truth                            | Visual role                        | Relevant styling                                                                   | Export note                                                                     |
| ------------ | ------------------------------------------ | ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Root wrapper | `StContextMenu`                            | Hosts global tippy theme injection | No local box model; injects surface styles for `[data-theme="context-menu"]`       | Treat as non-visual wrapper in Figma.                                           |
| Trigger      | default slot in `NvContextMenu.vue`        | Anchor element that opens the menu | Trigger behavior defaults to `click`                                               | Model the trigger separately from the menu surface.                             |
| Surface      | tippy content with `theme: 'context-menu'` | Menu container                     | `min-width: 150px`, `max-width: 300px`, `1px` border, `8px` radius, `boxShadow.lg` | Use one menu-surface component set; item rows are separate subcomponents.       |
| Option row   | `NvOption`                                 | Clickable menu action              | Disabled state and row spacing delegated to `NvOption`                             | Export as nested child component, not owned by this spec.                       |
| Leading icon | `NvIcon` inside `NvOption`                 | Optional item affordance           | Rendered only when `option.icon` exists; `size="3"`                                | Add an `Icon` boolean on the item component, not necessarily on the menu shell. |
| Divider      | `NvDivider direction="horizontal"`         | Separates option groups            | Styling delegated to `NvDivider`                                                   | Export as nested divider component if needed.                                   |

## Token Mapping

| Concern                  | Token                                                        | Resolved value                            | Where used                  |
| ------------------------ | ------------------------------------------------------------ | ----------------------------------------- | --------------------------- |
| Surface shadow           | `tokens.boxShadow.lg`                                        | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | Menu surface box shadow     |
| Surface border width     | `tokens.borderWidth.DEFAULT`                                 | `1px`                                     | Menu surface border width   |
| Surface radius           | `tokens.borderRadius.md` via `borderRadiusStyleBySize('md')` | `8px`                                     | Menu surface corner radius  |
| Offset from trigger      | `tokens.spacing.4`                                           | `12px`                                    | Tippy offset `[0, 12]`      |
| Light surface background | `theme.contextMenu.backgroundColor`                          | `colors.white` (`#ffffff`)                | Light theme menu background |
| Light surface border     | `theme.contextMenu.borderColor`                              | `colors.gray.20` (`#EBEBEB`)              | Light theme menu border     |
| Dark surface background  | `theme.contextMenu.backgroundColor`                          | `darken(0.0675, colors.gray.80)`          | Dark theme menu background  |
| Dark surface border      | `theme.contextMenu.borderColor`                              | `colors.gray.80` (`#444444`)              | Dark theme menu border      |

## Recommended Figma Mapping

| Figma property  | Type    | Suggested values | Derived from                                                      |
| --------------- | ------- | ---------------- | ----------------------------------------------------------------- |
| `Theme`         | Variant | `light, dark`    | Theme object branches                                             |
| `State`         | Variant | `rest, open`     | Tippy visibility only; no separate visual delta beyond visibility |
| `Has Divider`   | Boolean | `true, false`    | `options` union includes divider rows                             |
| `Item Disabled` | Boolean | `true, false`    | `option.disabled`                                                 |
| `Item Icon`     | Boolean | `true, false`    | `option.icon`                                                     |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Topic                    | Status    | Notes                                                                                                                    |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------ |
| Trigger slot API         | Ambiguous | Storybook uses `#reference`, but implementation only renders the default slot as trigger content.                        |
| Menu item content source | Ambiguous | Storybook shows slotted `NvOption` children, but implementation ignores slotted menu content and renders from `options`. |
| Text styling             | Not found | Container-level typography is not defined in this folder.                                                                |
| Disabled row visuals     | Not found | Disabled state is delegated to `NvOption`; exact colors and opacity are outside this folder.                             |
| Separator spacing        | Not found | Divider spacing is inherited from `NvDivider` and surrounding layout, not specified here.                                |
