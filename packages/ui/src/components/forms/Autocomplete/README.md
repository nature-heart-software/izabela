# NvAutocomplete

Controlled, portalled popup shell with consumer-defined rows and a virtual list. It does not render a text input, filter options, or define option typography.

## Units and source scope

Geometry produced by `polished.rem()` and the CSS helpers is in **rem**, with pixel equivalents below assuming a **16px root font size**. Numeric positioning offsets and SVG dimensions are passed as CSS-pixel numbers; they do not automatically scale with rem geometry. Line-height `1.4` is unitless; tracking `0.32px` is emitted as `0.02rem`. The docs describe the existing implementation, including limitations, not a redesigned control. Theme values are resolved from the real token/theme/helper inventory; `darken(0.0675, #444444)` resolves to `#333` (`#333333`). Browser resets and third-party behavior are identified separately rather than assigned invented appearances.

## Source Files Used

- [NvAutocomplete.vue](./NvAutocomplete.vue): trigger, portal, visibility, slots/events, selection and width computation.
- [autocomplete.shared.ts](./autocomplete.shared.ts): complete public prop definitions.
- [autocomplete.styled.ts](./autocomplete.styled.ts): popup and scroll-container styles.
- [NvVirtualList.vue](../../miscellaneous/VirtualList/NvVirtualList.vue), [virtual-list.shared.ts](../../miscellaneous/VirtualList/virtual-list.shared.ts), and [NvVirtualListContainer.vue](../../miscellaneous/VirtualList/NvVirtualListContainer.vue): delegated virtualization.
- [autocomplete.stories.ts](./autocomplete.stories.ts): example only; its `data` and `autoScrollValue` args are not component props.
- [CSS helpers](../../../utils/css-in-js.ts): `fontSizeStyle`, radius/padding/icon-position helpers.
- [Light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts), and [global stylesheet](../../../styles/main.scss).

## Component Axes

| Property          | Type / values                                                                           | Default               | Actual use                                                                                                                   |
| ----------------- | --------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `size`            | `sm`, `md`, `lg`                                                                        | `md`                  | Popup radius only; not row or input size.                                                                                    |
| `visible`         | boolean                                                                                 | `false`               | Controlled Ark `open`, blocker visibility and shell mount.                                                                   |
| `placement`       | Floating UI placement: `top`, `right`, `bottom`, `left`, each plain / `-start` / `-end` | `bottom-end`          | Passed to Ark positioning; external type also permits undefined.                                                             |
| `width`           | number                                                                                  | undefined             | **Minimum-width override**, not fixed width. Falsy `0` takes automatic fallback.                                             |
| `options`         | `unknown[]`                                                                             | fresh `[]`            | Virtual row data; no filtering here.                                                                                         |
| `valueKey`        | string                                                                                  | undefined             | `get(item, valueKey, item)` supplies virtual keys.                                                                           |
| `estimateSize`    | number                                                                                  | `spacing[7]` = `32px` | Passed as an attribute to `NvVirtualList`; currently not wired into its virtualizer options. Actual estimate remains `32px`. |
| `autoScrollIndex` | number                                                                                  | undefined             | Set as selection when the list reports visible; no range validation.                                                         |
| `selectOnTab`     | boolean                                                                                 | `false`               | Enables selecting the numeric highlight on Tab, with `preventDefault()`.                                                     |

No local variant, disabled, readonly, selected-model, invalid or loading prop. The script's `loading` ref and loading directive are not rendered.

## Size Specification

| Size | Radius source          | Radius at 16px root | Border                     | Width / height                            |
| ---- | ---------------------- | ------------------- | -------------------------- | ----------------------------------------- |
| `sm` | `borderRadius.sm`      | `6px` (`0.375rem`)  | `1px` (`0.0625rem`), solid | Width rules below; content-driven height. |
| `md` | `borderRadius.md`      | `8px` (`0.5rem`)    | same                       | same                                      |
| `lg` | `borderRadius.DEFAULT` | `8px` (`0.5rem`)    | same                       | same                                      |

`NvAutocomplete.vue` computes the minimum as truthy `width`, otherwise `max(measured reference width, 300)`. `StAutocomplete` applies that number through `rem()` to **min-width**, while CSS `width` remains `var(--reference-width)`. An override may be below `300px`; it cannot promise a width smaller than the reference. Reference measurement is in pixels but the minimum is emitted in rem, so the pixel-equivalent rule assumes the 16px root. Shell padding, gap, typography and icons are not authored. The scroll list has `max-height: 12.5rem` (`200px`) and `overflow-y: auto`.

## Variant And State Style Tables

| Theme  | State         | Shell fill                                       | Solid border                                        | Shadow                                                    | Text / rows                                                                                     |
| ------ | ------------- | ------------------------------------------------ | --------------------------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| light  | visible       | `theme.autocomplete.backgroundColor` = `#ffffff` | `theme.autocomplete.borderColor` = `#EBEBEB`, `1px` | `boxShadow.lg`: `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` | Consumer-defined.                                                                               |
| dark   | visible       | same key = `#333333`                             | same key = `#444444`, `1px`                         | same                                                      | Consumer-defined.                                                                               |
| either | enter / leave | unchanged                                        | unchanged                                           | unchanged                                                 | Global `.v-enter-active` / `.v-leave-active`: `all 0.3s`; opacity `0` at enter-from / leave-to. |
| either | closed        | shell unmounted after transition                 | N/A                                                 | N/A                                                       | Reference remains rendered; fixed blocker hidden with `v-show`.                                 |

No shell hover/focus/active/disabled/readonly visual branch. Shell **overflow: hidden** clips descendants to its radius; the shadow belongs on the shell, not the scroll list.

## Structure / Anatomy and delegated defaults

| Part              | Implementation                                                                  | Geometry / behavior                                                                                                                                                                                    |
| ----------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root / reference  | outer div; Ark Trigger `asChild`, `inline-flex w-full`                          | Consumer reference slot anchors and supplies visible trigger. The exported `StAutocompleteReferenceWrapper` is not used in this Vue template.                                                          |
| Popup system      | Ark Root `autoFocus=false`, `portalled=true`, controlled `open`                 | Default `bottom-end`, `flip=true`, **overflow padding `8px`** (`spacing[3]`), **main-axis offset `12px`** (`spacing[4]`). Third-party collision/focus behavior is delegated.                           |
| Portal / blocker  | Teleport to injected `PORTAL_TARGET` resolved by `getElement`, otherwise `body` | Deferred teleport; fixed full-viewport pointer blocker and positioner both `z-index: 9999`. Blocker and popup wrapper stop/prevent click, mouseup and mousedown. No blocker fill authored.             |
| Shell             | `StAutocomplete` inside unnamed Transition                                      | Surface, minimum width, clipping and radius above.                                                                                                                                                     |
| Virtual container | `NvVirtualListContainer` plus `.autocomplete__list`                             | List hidden with `v-show` when empty; fallback used instead.                                                                                                                                           |
| Virtual rows      | `NvVirtualList`                                                                 | Relative total-height container; absolute rows at top/left 0, width 100%, explicit item height in px and `translateY(item.start px)`. Actual estimate `32px`, overscan `5`, smooth scrolling disabled. |
| Fallback          | consumer `fallback` slot                                                        | Only when `options.length === 0`; no authored empty-state styling.                                                                                                                                     |

## Slots and Events

| Contract                                                                 | Payload / scope                                                                                 | Behavior                                                                                                            |
| ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `reference` slot                                                         | none                                                                                            | Consumer supplies trigger.                                                                                          |
| default slot                                                             | virtual item scope (`index`, `key`, `start`, `end`, `size`, `lane`, etc.) plus `item`, `active` | `active` means keyboard selection equals index. No built-in row pointer-selection handler; consumer must supply it. |
| `fallback` slot                                                          | none                                                                                            | Empty-array content.                                                                                                |
| `select` event                                                           | `options[selection]`                                                                            | Enter, or enabled Tab, when visible and selection is numeric. Does not update `visible` itself.                     |
| `positionerChange`                                                       | watched positioner ref value                                                                    | Emitted when that ref changes.                                                                                      |
| `openChange`                                                             | Ark details                                                                                     | Forwarded unchanged; consumer owns open state.                                                                      |
| `escapeKeyDown`, `focusOutside`, `interactOutside`, `pointerDownOutside` | respective Ark details                                                                          | Forwarded unchanged. No authored auto-close handler for these events.                                               |

## Selection behavior and existing limitations

- Visibility changes reset selection to `null`; options-reference changes set it to `0`; list `visible` sets it to `autoScrollIndex`. Numeric changes call delegated `scrollToIndex`; wheel resets selection to `null`.
- While open, Up/Down prevent default and wrap. With nonnumeric selection they begin at `autoScrollIndex || 0`; options are not filtered for disabled or readonly states.
- Empty options and invalid indices are not guarded: keys may create out-of-range numeric selection and `select` may emit `undefined`. Consumers must not assume every emitted item exists.
- `estimateSize` does not reach the virtualizer's declared `options`; customizing it alone does not change real row estimates. This is an existing implementation issue, not a documented working customization.
- Ark-generated accessibility, focus management, collision results and actual DOM/CSS integration require a browser with project dependencies. No additional vendor-specific surface styles are specified here.

## Token Mapping / Recommended Figma Mapping

Use `Size=sm/md/lg`, `Theme=light/dark`, `Visibility=closed/open`, and `Results=empty/list`. Width mode is **automatic minimum / explicit minimum override**, never fixed. Keep reference and row UI as consumer components; if rows are `NvOption`, use its separate specification in [Select](../Select/README.md). Use a clipped shell and separate scroll viewport; represent keyboard highlight on rows, not as shell selection. Geometry sources are `borderWidth.DEFAULT=1`, `borderRadius.sm/md/DEFAULT=6/8/8`, `spacing[3]=8`, `spacing[4]=12`, `spacing[7]=32`, hard-coded `defaultWidth=300` and list maximum `200`, with units distinguished above.
