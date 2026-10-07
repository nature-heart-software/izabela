# NvFormItem

A label-and-content layout wrapper. This folder exports **NvFormItem only**; there is no `NvForm` wrapper, form model, submit API or built-in validation system.

## Units and source scope

Geometry produced by `polished.rem()` and the CSS helpers is in **rem**, with pixel equivalents below assuming a **16px root font size**. Numeric positioning offsets and SVG dimensions are passed as CSS-pixel numbers; they do not automatically scale with rem geometry. Line-height `1.4` is unitless; tracking `0.32px` is emitted as `0.02rem`. The docs describe the existing implementation, including limitations, not a redesigned control. Theme values are resolved from the real token/theme/helper inventory; `darken(0.0675, #444444)` resolves to `#333` (`#333333`). Browser resets and third-party behavior are identified separately rather than assigned invented appearances.

## Source Files Used

- [NvFormItem.vue](./NvFormItem.vue): both stacks, label condition and props.
- [NvStack.vue](../../miscellaneous/Stack/NvStack.vue), [stack.shared.ts](../../miscellaneous/Stack/stack.shared.ts), [stack.styled.ts](../../miscellaneous/Stack/stack.styled.ts): delegated layout defaults.
- [NvText.vue](../../typography/Text/NvText.vue), [text.shared.ts](../../typography/Text/text.shared.ts), [text.styled.ts](../../typography/Text/text.styled.ts): delegated label typography.
- [CSS helpers](../../../utils/css-in-js.ts): `fontSizeStyle`, radius/padding/icon-position helpers.
- [Light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts), and [global stylesheet](../../../styles/main.scss).

## Component Axes

| Property / contract | Type                           | Default | Actual use                                                                    |
| ------------------- | ------------------------------ | ------- | ----------------------------------------------------------------------------- |
| `label`             | string                         | `''`    | Truthy value renders label row; empty string omits it.                        |
| `name`              | string                         | `''`    | Sets `<label for="name">`; does not assign an id or name to slotted controls. |
| default slot        | arbitrary field/helper content | empty   | Rendered inside the inner Stack.                                              |

No declared events, model, size, variant, required, invalid, disabled, readonly, selected or loading axis. Child controls own their states; attributes/listeners fall through to the root Stack rather than being distributed to slot children.

## Size Specification / delegated defaults

| Part                                          | Display / alignment                                                               | Gap                                        | Geometry / typography                                                                                                                                                       |
| --------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outer `NvStack spacing="3"`                   | flex column; align stretch; justify `left` → flex-start                           | `spacing[3]` = `8px` (`0.5rem`)            | Content-driven height/width; no authored padding, border, radius or shadow.                                                                                                 |
| Inner `NvStack`                               | default flex column; align stretch; justify `left` → flex-start; default `as=div` | **Default spacing `3` = `8px`** (`0.5rem`) | Separates slotted field/helper children; defaults are not inherited from an unknown layout.                                                                                 |
| `NvText type="label"` containing native label | Text wrapper defaults are delegated to NvText                                     | N/A                                        | `fontSize[2]` = **`14px`** (`0.875rem`), line-height **`1.4`**, tracking **`0.32px`** (`0.02rem`), **weight `700`**, `fontFamily.sans` (Nunito then system sans fallbacks). |

No control surface, icon, explicit minimum width/height, clipping or transition is authored by FormItem. Omission of the label also removes the label-to-content gap: the outer stack then has only the content stack.

## Variant And State Style Tables

| Theme  | State                                                    | Label color source / value                   | Wrapper surface            | Effects                                                                                          |
| ------ | -------------------------------------------------------- | -------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------ |
| light  | label present                                            | `theme.text.color` = `#444444`               | No authored fill or border | None authored.                                                                                   |
| dark   | label present                                            | `theme.text.color` = `#DCDCDC`               | No authored fill or border | None authored.                                                                                   |
| either | label absent                                             | No label rendered                            | Same layout wrapper        | No additional gap for missing label.                                                             |
| either | child disabled / readonly / invalid / required / loading | Label typography/color unchanged by FormItem | Child-dependent            | No local state propagation, validation indicator, required mark or error/helper text generation. |

## Structure / Anatomy

Outer Stack is the main vertical layout frame. Its first optional child is NvText wrapping `<label :for="name">`; its second child is a nested Stack containing the default slot. Labels become associated only if the consumer gives a field an **id matching `name`**. Slot content can contain helpers/errors, but FormItem neither generates nor styles them.

## Token Mapping / Recommended Figma Mapping

Use `Has label` as a Boolean and `Label` as consumer text, `Theme=light/dark`, and a field/helper-content slot. Both layout gaps resolve from `spacing[3]=8`; label size comes from `fontSize[2]=14` and `defaultTextStyle`, not from the slot control size. Reconstruct two vertical auto-layout frames with stretch alignment and content-driven height. Use the actual themed 14px/700 label; do not invent wrapper size or validation variants. Nunito requires the consuming application to load the font asset; system sans fallbacks apply otherwise.
