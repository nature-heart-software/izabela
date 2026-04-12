# NvVirtualList Family Design Spec

- Purpose: provide a scroll-container + virtualized-list pair for rendering large item sets with absolute-positioned visible rows only.
- Source files used: `NvVirtualList.vue`, `NvVirtualListContainer.vue`, `virtual-list.shared.ts`, `virtual-list.stories.ts`

## Component Axes

| Property           | Kind                  | Values                                         | Default   | Notes                                                                                                                                  |
| ------------------ | --------------------- | ---------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `count`            | number                | Any non-negative integer                       | `0`       | Declared as `required: true` and `default: 0`; drives total item count.                                                                |
| `options`          | object                | Partial `VirtualizerOptions<Element, Element>` | `{}`      | Merged onto internal defaults.                                                                                                         |
| container presence | structural dependency | `NvVirtualListContainer` wrapper               | Not found | `NvVirtualList` injects container context from `NvVirtualListContainer`; behavior without a provider is not documented in this folder. |
| visible item slot  | slot                  | `#default="{ index, key, size, start, ... }"`  | Not found | Slot receives TanStack virtual item data.                                                                                              |
| events             | emitted state         | `visible`, `hidden`, `change`                  | Not found | `visible` fires on mount after `setTimeout`, `hidden` on unmount, `change` when the virtualizer reports changes.                       |

## Size Specification

| Component / Axis             | Height                       | Min width      | Padding X | Padding Y | Gap | Radius | Border width | Typography | Icon size | Notes                                                                                                 |
| ---------------------------- | ---------------------------- | -------------- | --------- | --------- | --- | ------ | ------------ | ---------- | --------- | ----------------------------------------------------------------------------------------------------- |
| `NvVirtualListContainer`     | Parent-defined               | Parent-defined | 0         | 0         | 0   | N/A    | 0            | N/A        | N/A       | Wrapper is an unstyled `div`; Storybook sets `height: 200px`, `overflowY: auto`, `marginRight: 10px`. |
| `NvVirtualList` total canvas | `virtualizer.getTotalSize()` | 100%           | 0         | 0         | 0   | N/A    | 0            | N/A        | N/A       | Outer internal `div` gets computed total height and `position: relative`.                             |
| virtual row                  | `${item.size}px`             | 100%           | 0         | 0         | 0   | N/A    | 0            | N/A        | N/A       | Each row is absolutely positioned with `transform: translateY(${item.start}px)`.                      |
| estimated row size           | 32px                         | N/A            | N/A       | N/A       | N/A | N/A    | N/A          | N/A        | N/A       | Internal default `estimateSize` is `tokens.spacing.7` = 32px unless overridden by `options`.          |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| Light | container | Rest | Inherited | same as text | None | none | None | N/A | 1 | No theme styling in folder. |
| Light | list | Rest | Inherited | same as text | None | none | None | N/A | 1 | No theme styling in folder. |
| Dark | container | Rest | Inherited | same as text | None | none | None | N/A | 1 | No theme styling in folder. |
| Dark | list | Rest | Inherited | same as text | None | none | None | N/A | 1 | No theme styling in folder. |
| Light | list | `visible` | Inherited | same as text | None | none | None | N/A | 1 | Event emitted on mount after a timeout; no visual delta. |
| Light | list | `hidden` | Inherited | same as text | None | none | None | N/A | 1 | Event emitted on unmount; no visual delta. |
| Light | list | `change` | Inherited | same as text | None | none | None | N/A | 1 | Event emitted from virtualizer `onChange`; no visual delta. |
| Dark | list | `visible` / `hidden` / `change` | Inherited | same as text | None | none | None | N/A | 1 | Same as light theme. |

## Structure / Anatomy

| Part               | Source of truth              | Visual role                                 | Relevant styling                                                                                        | Export note                                                                    |
| ------------------ | ---------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| container provider | `NvVirtualListContainer.vue` | Supplies scroll element context to the list | Plain `div` with `ref` only                                                                             | In Figma, represent this as the scroll frame that clips content.               |
| list canvas        | `NvVirtualList.vue`          | Represents total scrollable height          | `height: rem(virtualizer.getTotalSize())`, `position: relative`                                         | This is the internal content frame inside the scroll container.                |
| row wrapper        | `NvVirtualList.vue`          | Positions each rendered item                | `position: absolute`, `width: 100%`, `height: ${item.size}px`, `transform: translateY(${item.start}px)` | Document as generated layout, not as a manually designed variant.              |
| item slot          | `NvVirtualList.vue`          | Actual item content                         | Provided by consumer via default scoped slot                                                            | The designed row content belongs to the consuming feature, not this primitive. |

## Token Mapping

| Concern                                | Token              | Resolved value | Where used                                                                    |
| -------------------------------------- | ------------------ | -------------- | ----------------------------------------------------------------------------- |
| default estimated row size             | `tokens.spacing.7` | 32px           | `estimateSize` default in `NvVirtualList.vue`                                 |
| scroll / virtualization styling tokens | Not found          | Unsupported    | No color, radius, shadow, or typography tokens are referenced in this folder. |

## Recommended Figma Mapping

| Figma property           | Type    | Suggested values                | Derived from                                     |
| ------------------------ | ------- | ------------------------------- | ------------------------------------------------ |
| `Component`              | Variant | `Container, List`               | Two public components in the folder              |
| `Has Provider Container` | Boolean | `true, false`                   | Structural dependency between list and container |
| `State`                  | Variant | `rest, visible, hidden, change` | Emitted lifecycle / update events                |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                                      | Status           | Notes                                                                                                               |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------- |
| Behavior without `NvVirtualListContainer` | Not found        | `getScrollElement` reads injected context, but fallback behavior is not specified in this folder.                   |
| Supported `options` matrix                | Not found        | The full option surface is delegated to TanStack `VirtualizerOptions`.                                              |
| Exact row height after custom `options`   | Consumer-defined | Consumers can override `estimateSize` or other sizing behavior through `options`.                                   |
| Figma representation of virtualization    | Ambiguous        | Figma should usually model the rest state with a few representative rows, not the runtime virtualization mechanics. |
