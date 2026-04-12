# NvAutocomplete

Autocomplete popover shell for searchable option lists. It renders a reference slot, a portalled popup, and a virtualized option list.

## Source Files Used

- `NvAutocomplete.vue`
- `autocomplete.shared.ts`
- `autocomplete.styled.ts`
- `autocomplete.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property          | Kind    | Values                       | Default                      | Notes                                                                                                         |
| ----------------- | ------- | ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `size`            | enum    | `sm`, `md`, `lg`             | `md`                         | Only affects popup radius. Option row sizing comes from consumer slot or `NvOption`, not from this component. |
| `visible`         | boolean | `true`, `false`              | `false`                      | Controls popover open state.                                                                                  |
| `placement`       | enum    | Floating UI placement string | `bottom-end`                 | Passed to Ark Popover positioning.                                                                            |
| `width`           | number  | any number                   | `undefined`                  | Popup min-width override in px.                                                                               |
| `options`         | array   | `unknown[]`                  | `[]`                         | Data source for the virtual list.                                                                             |
| `valueKey`        | string  | any string                   | `undefined`                  | Used to derive option keys.                                                                                   |
| `estimateSize`    | number  | any number                   | `tokens.spacing[7]` = `32px` | Virtual row estimate only.                                                                                    |
| `autoScrollIndex` | number  | any number                   | `undefined`                  | Initial highlighted row when opened or list becomes visible.                                                  |
| `selectOnTab`     | boolean | `true`, `false`              | `false`                      | When `true`, `Tab` selects the active option.                                                                 |
| `reference` slot  | slot    | custom trigger               | N/A                          | Required for practical use.                                                                                   |
| `default` slot    | slot    | custom row UI                | N/A                          | Receives `item`, `index`, `active`.                                                                           |
| `fallback` slot   | slot    | empty-state content          | N/A                          | Rendered when `options.length === 0`.                                                                         |

## Size Specification

| Size | Height    | Min width                                                   | Padding X | Padding Y | Gap | Radius                                | Border width                         | Typography | Icon size | Notes                                                                    |
| ---- | --------- | ----------------------------------------------------------- | --------- | --------- | --- | ------------------------------------- | ------------------------------------ | ---------- | --------- | ------------------------------------------------------------------------ |
| `sm` | Not found | `300px` minimum unless `width` or reference width is larger | N/A       | N/A       | N/A | `tokens.borderRadius.sm` = `6px`      | `tokens.borderWidth.DEFAULT` = `1px` | Not found  | N/A       | Popup width is `max(reference width, 300px)` unless `width` is provided. |
| `md` | Not found | same as above                                               | N/A       | N/A       | N/A | `tokens.borderRadius.md` = `8px`      | `1px`                                | Not found  | N/A       |                                                                          |
| `lg` | Not found | same as above                                               | N/A       | N/A       | N/A | `tokens.borderRadius.DEFAULT` = `8px` | `1px`                                | Not found  | N/A       |                                                                          |

## Variant And State Style Tables

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| light | base | rest | Slot-defined | same as text | `theme.autocomplete.backgroundColor` = `#ffffff` | `1px` / `theme.autocomplete.borderColor` = `#EBEBEB` | `tokens.boxShadow.lg` = `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | by `size` | `1` | Popup shell only. Row styling is delegated to slot content / child component. |
| dark | base | rest | Slot-defined | same as text | `darken(0.0675, #444444)` | `1px` / `#444444` | `tokens.boxShadow.lg` = `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | by `size` | `1` |  |

## Structure / Anatomy

| Part                   | Source of truth                          | Visual role                                | Relevant styling                                                 | Export note                                                  |
| ---------------------- | ---------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| reference trigger      | `reference` slot in `NvAutocomplete.vue` | Opens / anchors popup                      | Width is measured and used for popup sizing                      | Model as external trigger, not part of popup component set.  |
| backdrop blocker       | fixed `div` in `NvAutocomplete.vue`      | Captures outside pointer events while open | Full-screen, `z-index: 9999`                                     | Usually omit from Figma component export.                    |
| positioner / content   | Ark Popover wrapper                      | Positions popup                            | Placement, flip, overflow padding `4px`, main-axis offset `12px` | Capture as positioning behavior note, not as a visible part. |
| popup shell            | `StAutocomplete`                         | Popup surface                              | Border, radius, background, shadow, min-width                    | Main frame in Figma.                                         |
| virtual list container | `.autocomplete__list`                    | Scroll area                                | `max-height: 200px`, `overflow-y: auto`                          | Model as scrollable content area.                            |
| option row             | consumer `default` slot                  | Option visuals                             | Not defined by this component                                    | Use downstream component spec if `NvOption` is used.         |
| fallback               | `fallback` slot                          | Empty state                                | Not styled here                                                  | Document separately per consumer.                            |

## Token Mapping

| Concern               | Token                         | Resolved value                            | Where used                          |
| --------------------- | ----------------------------- | ----------------------------------------- | ----------------------------------- |
| popup min width       | `defaultWidth`                | `300px`                                   | `StAutocomplete` min-width fallback |
| popup border width    | `tokens.borderWidth.DEFAULT`  | `1px`                                     | popup shell                         |
| popup shadow          | `tokens.boxShadow.lg`         | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | popup shell                         |
| popup radius `sm`     | `tokens.borderRadius.sm`      | `6px`                                     | `size='sm'`                         |
| popup radius `md`     | `tokens.borderRadius.md`      | `8px`                                     | `size='md'`                         |
| popup radius `lg`     | `tokens.borderRadius.DEFAULT` | `8px`                                     | `size='lg'`                         |
| popup offset          | `tokens.spacing[4]`           | `12px`                                    | popover main-axis offset            |
| overflow padding      | `tokens.spacing[3]`           | `8px`                                     | popover collision padding           |
| virtual row estimate  | `tokens.spacing[7]`           | `32px`                                    | `estimateSize` default              |
| max popup list height | hard-coded                    | `200px`                                   | `.autocomplete__list`               |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values           | Derived from                          |
| -------------- | ------- | -------------------------- | ------------------------------------- |
| `Size`         | variant | `sm, md, lg`               | `size` prop                           |
| `State`        | variant | `closed, open`             | `visible` prop                        |
| `Theme`        | variant | `light, dark`              | theme files                           |
| `Has Results`  | boolean | `true, false`              | `options.length > 0` vs `fallback`    |
| `Selection`    | variant | `none, active-row`         | keyboard highlight behavior           |
| `Width Mode`   | variant | `auto-from-trigger, fixed` | reference measurement vs `width` prop |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                                  | Status                   | Notes                                                                                       |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Row typography and row colors         | Not found in this folder | Row UI is entirely slot-driven.                                                             |
| Loading state                         | Not found / unused       | `loading` ref and `vLoading` directive are present in script but not rendered.              |
| Story args mismatch                   | Found                    | Story uses `data` and `autoScrollValue`; component expects `options` and `autoScrollIndex`. |
| Disabled / invalid popup shell states | Unsupported              | No styling or props for these states in this folder.                                        |
