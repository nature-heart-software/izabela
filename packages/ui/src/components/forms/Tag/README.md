# NvTag

Fixed-size chip with slotted label content and a nested ghost `xs` close button. **The current template renders the close button unconditionally.** `closable` changes padding only; it does not control visibility or suppress the close event.

## Units and source scope

Geometry produced by `polished.rem()` and the CSS helpers is in **rem**, with pixel equivalents below assuming a **16px root font size**. Numeric positioning offsets and SVG dimensions are passed as CSS-pixel numbers; they do not automatically scale with rem geometry. Line-height `1.4` is unitless; tracking `0.32px` is emitted as `0.02rem`. The docs describe the existing implementation, including limitations, not a redesigned control. Theme values are resolved from the real token/theme/helper inventory; `darken(0.0675, #444444)` resolves to `#333` (`#333333`). Browser resets and third-party behavior are identified separately rather than assigned invented appearances.

## Source Files Used

- [NvTag.vue](./NvTag.vue): unconditional close wrapper/button, default slot and `close` emit.
- [tag.shared.ts](./tag.shared.ts), [tag.styled.ts](./tag.styled.ts): single prop and chip geometry.
- [NvButton.vue](../Button/NvButton.vue), [button.shared.ts](../Button/button.shared.ts), [button.styled.ts](../Button/button.styled.ts): close-button defaults, icon-only squaring and interactions.
- [NvIcon.vue](../../typography/Icon/NvIcon.vue): actual icon dimensions/currentColor.
- [tag.stories.ts](./tag.stories.ts): content is an example arg rendered into the slot, not a Tag prop.
- [CSS helpers](../../../utils/css-in-js.ts): `fontSizeStyle`, radius/padding/icon-position helpers.
- [Light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts), and [global stylesheet](../../../styles/main.scss).

## Component Axes

| Property / contract           | Type / values                | Default | Actual effect                                                                                                             |
| ----------------------------- | ---------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------- |
| `closable`                    | Boolean                      | `false` | Selects content-wrapper padding: false `8px / 8px`, true **`8px / 24px`** (left/right). Button is mounted in both states. |
| default slot                  | arbitrary label/content      | empty   | Rendered before the close wrapper.                                                                                        |
| `close` event                 | no payload                   | N/A     | Nested button click calls `emit('close')`, regardless of `closable`. Parent decides removal; no self-removal/model.       |
| attributes / native listeners | Vue fallthrough to chip root | N/A     | Not forwarded to the close button as a dedicated close-button API.                                                        |

No public size, type/variant, selected, disabled, readonly, invalid or loading axis. No root hover/focus/pressed branch. `closable=false` is **not** an implemented noninteractive mode.

## Size Specification

| Part                                 | Authored geometry / typography                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Root span (`StTag`)                  | Relative inline-flex, center aligned, height `spacing[6]` = **`24px`** (`1.5rem`), min-width `0`, border width `1px`, radius `sm` = **`6px`**, outline `0`, transition `all .3s`; no root padding/gap/color/shadow authored.                                                                                                                                       |
| Root type                            | `fontSize[1]` = `12px` (`0.75rem`), line-height `1.4`, tracking `0.32px` (`0.02rem`), weight `600`. Font family/color inherited from parent context.                                                                                                                                                                                                               |
| Content span (`StTagContentWrapper`) | Relative, margin **`-1px` on all sides**, min-width `0`, nowrap, overflow hidden, text-overflow ellipsis; horizontal padding `8px / 8px` false or **`8px / 24px`** true; no local vertical padding.                                                                                                                                                                |
| Close span (`StTagIcon`)             | Absolute inline-flex inside content wrapper; helper `iconStyleBySize('sm')` gives **right `4px`** (`0.25rem`); no authored top/vertical transform.                                                                                                                                                                                                                 |
| Close button (`NvButton`)            | `type=ghost`, `size=xs`, `iconName=times`. Empty label slot auto-squares: **`16px × 16px`** (`spacing[5]`), padding `0`, centered contents, radius `4px`, transparent `1px` border, relative inline-flex, flex-shrink 0, overflow hidden and `all .3s` transition. Default selected/squared/loading props are false, but computed icon-only squaring is true here. |
| Close icon (`NvIcon`)                | Button uses key `1` → **`fontSize[1]=12px × 12px`**, SVG `fill=currentColor`. In normal flow within square button; SVG numeric dimensions are not rem.                                                                                                                                                                                                             |

The close wrapper is inside the clipped content span. In `closable=false`, the unreserved button can overlap label content and is still clipped with that content. Tag does not author a root overflow rule; content clipping and nested-button clipping belong to their respective layers. Constrained width drives content ellipsis; natural width is content-driven.

## Variant And State Style Tables

### Chip surface

| Theme | `closable`    | Text                                | Fill                                    | Border                                           | Effects                           |
| ----- | ------------- | ----------------------------------- | --------------------------------------- | ------------------------------------------------ | --------------------------------- |
| light | false or true | **Inherited**, no local color token | `theme.tag.backgroundColor` = `#ffffff` | `theme.tag.borderColor` = `#EBEBEB`, width `1px` | No authored shadow/opacity state. |
| dark  | false or true | **Inherited**, no local color token | same fill key = `#333333`               | same border key = `#444444`, width `1px`         | Same.                             |

Only padding differs between closable values. The close icon does **not** simply inherit the Tag's context-dependent text color: its NvButton sets a themed ghost-button color.

### Nested close-button states (both `closable` values)

| Theme | Button state        | Text / icon | Fill                           | Border            | Focus shadow        |
| ----- | ------------------- | ----------- | ------------------------------ | ----------------- | ------------------- |
| light | rest                | `#444444`   | transparent                    | `1px` transparent | None authored.      |
| light | hover               | `#444444`   | `#F9F9FC`                      | same              | None authored.      |
| light | pressed (`:active`) | `#444444`   | `#DCDCDC`                      | same              | None authored.      |
| light | focus (`:focus`)    | `#444444`   | transparent absent hover/press | same              | `0 0 0 4px #F9F9FC` |
| dark  | rest                | `#DCDCDC`   | transparent                    | `1px` transparent | None authored.      |
| dark  | hover               | `#DCDCDC`   | `#444444`                      | same              | None authored.      |
| dark  | pressed (`:active`) | `#DCDCDC`   | `#2B2B2C`                      | same              | None authored.      |
| dark  | focus (`:focus`)    | `#DCDCDC`   | transparent absent hover/press | same              | `0 0 0 4px #444444` |

Values come from `theme.button.ghost.color/backgroundColor/borderColor/hover.backgroundColor/active.backgroundColor/focus.boxShadow`. Pressed is declared after hover and wins when both apply; focus adds a ring without replacing interaction fill. The button's outward ring can be clipped by the content wrapper. Tag does not pass selected/loading/disabled controls to this button; no additional such Tag state should be invented.

## Actual close-button conditional behavior and limitations

There is **no `v-if`, `v-show` or styled visibility branch** for the close wrapper or button. The only `closable` conditional is the choice of horizontal padding helper. False still renders the close affordance and still emits `close` when its button is clicked. This pre-existing implementation inconsistency is documented, not fixed. Label text and close button remain consumer-visible content; interaction visibility under width constraints follows clipping, not a closable Boolean visibility rule. No close-label/ARIA naming or explicit button `type` attribute is provided by Tag; do not assume accessibility or form-submit semantics beyond the actual delegated/native element.

## Token Mapping / Recommended Figma Mapping

Height `spacing[6]=24`; content margin `-borderWidth.DEFAULT=-1`; plain padding `spacing[3]=8`; closable right padding **`spacing[3]+spacing[5]=8+16=24`**; chip radius `borderRadius.sm=6`; close right `spacing[2]=4`; close square `spacing[5]=16`; close icon `fontSize[1]=12`; close radius `borderRadius.xs=4`.

Use `Theme=light/dark` and `Closable padding=false/true`, not a Boolean that hides the close icon. Keep both actual layouts with a nested 16px ghost close-button instance. Surface styling belongs on the root span; ellipsis and clipping on the negative-margin content span; position the close wrapper relative to that span. Keep Tag text inherited while using the explicitly themed close icon; absent a known parent, do not assign a made-up text token or fixed text color.
