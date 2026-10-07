# NvTextarea

Styled **native textarea**, not an Element Plus ElInput. It reuses `theme.input`, applies a final `64px` height for every size, and squares the bottom-right corner.

## Units and source scope

Geometry produced by `polished.rem()` and the CSS helpers is in **rem**, with pixel equivalents below assuming a **16px root font size**. Numeric positioning offsets and SVG dimensions are passed as CSS-pixel numbers; they do not automatically scale with rem geometry. Line-height `1.4` is unitless; tracking `0.32px` is emitted as `0.02rem`. The docs describe the existing implementation, including limitations, not a redesigned control. Theme values are resolved from the real token/theme/helper inventory; `darken(0.0675, #444444)` resolves to `#333` (`#333333`). Browser resets and third-party behavior are identified separately rather than assigned invented appearances.

## Source Files Used

- [NvTextarea.vue](./NvTextarea.vue): native styled root, `defineModel()`, exposed input ref; imports Element Plus input CSS without rendering ElInput.
- [textarea.shared.ts](./textarea.shared.ts), [textarea.styled.ts](./textarea.styled.ts): size prop, all geometry and local state rules.
- [textarea.stories.ts](./textarea.stories.ts): `content` initializes the story model; it is not a public component prop.
- [CSS helpers](../../../utils/css-in-js.ts): `fontSizeStyle`, radius/padding/icon-position helpers.
- [Light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts), and [global stylesheet](../../../styles/main.scss).

## Component Axes, Slots and Events

| Contract                      | Type / values                                                                   | Default           | Actual behavior                                                                                                                   |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `size`                        | `sm`, `md`, `lg`                                                                | `md`              | Typography, horizontal padding and three corner radii. Does not change final height.                                              |
| `modelValue` / `v-model`      | untyped `defineModel()`                                                         | undefined         | Vue generates `update:modelValue`; template applies `v-model` to the styled textarea component. No explicit numeric/coercion API. |
| Native attributes / listeners | e.g. placeholder, id, name, rows, cols, disabled, readonly, maxlength, required | No local defaults | Vue root fallthrough to the styled/native textarea; native semantics are distinct from authored state visuals.                    |
| exposed `input`               | computed styled-component `$el`                                                 | N/A               | Accesses the underlying textarea after mount; getter is not guarded before the ref exists.                                        |
| Slots                         | none rendered                                                                   | N/A               | No label/prefix/suffix/helper/clear/icon slot forwarding.                                                                         |

No type/variant, selected, invalid/error, disabled, readonly or loading props/styles are defined locally. Native disabled/readonly/required can affect interaction/validation; no special visual branch accompanies them. Imported Element Plus input CSS does not imply ElInput icons, autosize, clear behavior, disabled palette or ElInput events.

## Size Specification

| Size | Final height        | Padding left / right   | Padding top / bottom      | Radius TL / TR / BL / BR | Border width        | Font / line-height / tracking / weight |
| ---- | ------------------- | ---------------------- | ------------------------- | ------------------------ | ------------------- | -------------------------------------- |
| `sm` | **`64px`** (`4rem`) | `8px / 8px` (`0.5rem`) | `7px / 7px` (`0.4375rem`) | `6px / 6px / 6px / 0`    | `1px` (`0.0625rem`) | `12px / 1.4 / 0.32px / 600`            |
| `md` | **`64px`** (`4rem`) | `16px / 16px` (`1rem`) | `7px / 7px`               | `8px / 8px / 8px / 0`    | `1px`               | `12px / 1.4 / 0.32px / 600`            |
| `lg` | **`64px`** (`4rem`) | `16px / 16px` (`1rem`) | `7px / 7px`               | `8px / 8px / 8px / 0`    | `1px`               | `14px / 1.4 / 0.32px / 600`            |

Size branches first assign `24/32/40px` heights, then the later `spacing[10]` height overrides them to `64px`. Vertical padding is `spacing[3]-1 = 7px`. `border-bottom-right-radius: 0` overrides the full radius helper. These are CSS heights under the consuming reset/box-sizing, not a guarantee about an isolated content-box element's outer size. Width, minimum width/height, max-height, font family, resize and scrollbar appearance are not authored here. Font family is inherited from the consuming page; the shared font-size helper does not set Nunito. Root has `align-items:center` but no flex display, outline `0`, and transition `all .3s`.

## Variant And State Style Tables

| Theme | State | Text      | Fill          | Border (`1px`) | Shadow              |
| ----- | ----- | --------- | ------------- | -------------- | ------------------- |
| light | rest  | `#444444` | `#ffffff`     | `#EBEBEB`      | None authored.      |
| light | hover | `#444444` | `#ffffff`     | **`#DCDCDC`**  | None authored.      |
| light | focus | `#444444` | `#ffffff`     | **`#DCDCDC`**  | `0 0 0 4px #F9F9FC` |
| dark  | rest  | `#DCDCDC` | **`#333333`** | `#444444`      | None authored.      |
| dark  | hover | `#DCDCDC` | `#333333`     | `#626262`      | None authored.      |
| dark  | focus | `#DCDCDC` | `#333333`     | `#626262`      | `0 0 0 4px #444444` |

The sources are **`theme.input`**, not `theme.textarea`: `.color`, `.backgroundColor`, `.borderColor`, `.hover.borderColor`, `.focus.borderColor` and `.focus.boxShadow`. All sizes retain their corner geometry in every state. There is no local opacity change. Hover and focus can coexist; focus is declared later, and both resolve to the same interaction border in each theme.

| Theme | Placeholder source / color                  | Typography                                                           |
| ----- | ------------------------------------------- | -------------------------------------------------------------------- |
| light | `theme.input.placeholder.color` = `#BEBEBE` | Weight **`300`**, inherited size/line-height/tracking from textarea. |
| dark  | same key = `#818181`                        | Same.                                                                |

Placeholder is pseudo-element text, not an alternate field fill/border. No icon is rendered; icon color/size is not applicable. Disabled/readonly fields still use these authored rules wherever native pseudo-class conditions apply, with any browser/reset effects additional rather than a locally defined state palette.

## Structure / Anatomy and delegated behavior

The single `StTextarea` native element owns padding, text, placeholder, border, background, asymmetric radius and focus ring. It is the visible component surface and editing area, not an extra wrapper plus inner ElInput field. Native rows/cols, scrolling, validation, selection and disabled/readonly behavior are browser-dependent. There is **no local `resize`, overflow, autosize, clipping or scrollbar rule**. Global styles include Tailwind base/components/utilities, but exact generated reset behavior depends on the consuming build; the README does not invent vendor appearances or a guaranteed resize direction.

The Vue template binds `v-model` to a styled-component root. The outer `defineModel()` establishes the public generated update event, but this file has no explicit native `@input` bridge. Actual styled-component model forwarding/display needs browser verification with the project's dependencies; do not equate the presence of `defineModel()` with a measured native typing result.

## Token Mapping / Recommended Figma Mapping

Final height `spacing[10]=64`; horizontal padding helper uses `spacing[3]=8` for sm and `spacing[5]=16` for md/lg; vertical padding `spacing[3]-1=7`; radius `borderRadius.sm/md/DEFAULT=6/8/8` with bottom-right override `0`; border/focus spread `borderWidth.DEFAULT/lg=1/4`; type `fontSize[1/2]=12/14`; transition `transition.DEFAULT=all .3s`.

Use `Size=sm/md/lg`, `Theme=light/dark` and authored visual `State=rest/hover/focus`, plus placeholder text content. Keep height `64px` across sizes and bottom-right radius `0`. Apply the focus ring to the same native surface, not an invented wrapper. Native disabled/readonly may be annotated as behavior but should not acquire unsupported visual variants. Font family, resize-handle appearance and native model forwarding remain consumer/dependency/browser concerns, explicitly separated from the resolved local style specification.
