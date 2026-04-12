# NvAccessBlocker Design Notes

Purpose: blocks interaction with wrapped content and, when access is denied, overlays a reason panel above the content.

Source files used:

- `NvAccessBlocker.vue`
- `access-blocker.shared.ts`
- `access-blocker.styled.ts`
- `access-blocker.stories.ts`
- `@/utils/css-in-js.ts`
- `@/themes/light.ts`
- `@/themes/dark.ts`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property      | Kind         | Values              | Default               | Notes                                                                                                                                                        |
| ------------- | ------------ | ------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `allowed`     | boolean prop | `true`, `false`     | `false`               | When `false`, renders the overlay reason layer and adds `overflow-hidden` to the root.                                                                       |
| `reason`      | string prop  | Any string          | `''`                  | Used only by the default `reason` slot content.                                                                                                              |
| `as`          | string prop  | Any HTML tag string | `'div'`               | Passed into styled props, but the styled root is declared as `styled('div', props)`, so supported rendered tag behavior is Not found from this folder alone. |
| `reason` slot | slot         | custom content      | default slot fallback | Replaces the default centered `NvAlert size="sm"` wrapper.                                                                                                   |
| default slot  | slot         | blocked content     | N/A                   | Always rendered under the overlay.                                                                                                                           |

## Size Specification

| Size                   | Height                                 | Min width      | Padding X             | Padding Y             | Gap                   | Radius                | Border width          | Typography            | Icon size   | Notes                                                      |
| ---------------------- | -------------------------------------- | -------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | --------------------- | ----------- | ---------------------------------------------------------- |
| Root container         | Not found                              | Not found      | Not found             | Not found             | Not found             | Not found             | Not found             | N/A                   | N/A         | Root only sets `position: relative`.                       |
| Overlay layer          | `top/right/bottom/left: 0` over parent | Matches parent | Not found             | Not found             | Not found             | Not found             | Not found             | N/A                   | N/A         | Absolute positioned full-cover layer with `z-index: 3000`. |
| Default reason content | Depends on nested `NvAlert size="sm"`  | Not found      | See `Alert/README.md` | See `Alert/README.md` | See `Alert/README.md` | See `Alert/README.md` | See `Alert/README.md` | See `Alert/README.md` | Unsupported | Only used when no `reason` slot is provided.               |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| light | default | allowed | N/A | N/A | Transparent / inherited | none | None | N/A | 1 | Only the wrapped content is visible. |
| light | default | blocked | Inherited from reason slot content | same as text | `theme.disabledItemBackground.backdropColor` = `colors.white` (`#ffffff`), rendered via `rgba(..., 0.9)` = `rgba(255,255,255,0.9)` | none | None | Not found | 0.9 overlay alpha | Overlay fills the component bounds. |
| dark | default | allowed | N/A | N/A | Transparent / inherited | none | None | N/A | 1 | Only the wrapped content is visible. |
| dark | default | blocked | Inherited from reason slot content | same as text | `theme.disabledItemBackground.backdropColor` = dark theme `backgroundColor` = `darken(0.0675, #444444)` = `#333333`, rendered via `rgba(..., 0.9)` = `rgba(51,51,51,0.9)` | none | None | Not found | 0.9 overlay alpha | Overlay fills the component bounds. |

## Structure / Anatomy

| Part           | Source of truth                                   | Visual role                                             | Relevant styling                                                                 | Export note                                                                               |
| -------------- | ------------------------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| root container | `NvAccessBlocker.vue`, `access-blocker.styled.ts` | Hosts content and establishes positioning context       | `position: relative`                                                             | Figma frame should be the parent wrapper for content plus overlay.                        |
| content slot   | `NvAccessBlocker.vue`                             | Original blocked content                                | No extra styling in this folder                                                  | Keep as a slot/content region under the overlay layer.                                    |
| overlay layer  | `StAccessBlockerReason`                           | Prevents interaction and visually masks blocked content | Absolute fill, `z-index: 3000`, disabled-item backdrop color                     | Represent as a full-size overlay frame above content.                                     |
| center wrapper | `NkCenter` usage in template                      | Centers the reason UI in both axes                      | `w-full h-full`; further layout behavior comes from `NvCenter`, not defined here | Centering is evidenced, but exact gap/alignment implementation lives outside this folder. |
| reason content | fallback `NvAlert size="sm"` inside `reason` slot | Default message presentation                            | Uses nested alert component when slot not overridden                             | Model as swappable slot content, not a fixed part of the component set.                   |

## Token Mapping

| Concern                | Token                                                                                                    | Resolved value  | Where used                             |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | --------------- | -------------------------------------- |
| overlay light backdrop | `theme.disabledItemBackground.backdropColor` -> `backgroundColor` -> `colors.white`                      | `#ffffff`       | Light theme blocked overlay fill       |
| overlay light opacity  | `theme.disabledItemBackground.backdropOpacity`                                                           | `0.9`           | Light theme blocked overlay fill alpha |
| overlay dark backdrop  | `theme.disabledItemBackground.backdropColor` -> `backgroundColor` -> `darken(0.0675, colors.gray['80'])` | `#333333`       | Dark theme blocked overlay fill        |
| overlay dark opacity   | `theme.disabledItemBackground.backdropOpacity`                                                           | `0.9`           | Dark theme blocked overlay fill alpha  |
| overlay stacking       | Hard-coded value                                                                                         | `z-index: 3000` | Overlay layer                          |

## Recommended Figma Mapping

| Figma property   | Type    | Suggested values               | Derived from                         |
| ---------------- | ------- | ------------------------------ | ------------------------------------ |
| `Theme`          | Variant | `light`, `dark`                | Theme-driven overlay backdrop values |
| `State`          | Variant | `allowed`, `blocked`           | `allowed` prop                       |
| `Reason Content` | Variant | `default-alert`, `custom-slot` | Presence of custom `reason` slot     |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Topic                                             | Status      | Notes                                                                                                   |
| ------------------------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------- |
| Rendered `as` element behavior                    | Not found   | The prop exists, but this folder does not prove the styled component actually changes its rendered tag. |
| Overlay transition states                         | Not found   | A Vue `<Transition>` wrapper exists, but no enter/leave classes or timing are defined in this folder.   |
| Border, radius, and spacing of overlay shell      | Unsupported | The overlay itself has no border, radius, or padding rules in this folder.                              |
| `sizeValues` export in `access-blocker.shared.ts` | Unsupported | `['xs', 'sm', 'md']` is exported but not consumed by `NvAccessBlocker` props or stories.                |
| Interaction lock mechanism                        | Not found   | Visual masking is defined; explicit `pointer-events` rules are not present in this folder.              |
