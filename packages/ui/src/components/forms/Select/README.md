# NvSelect and NvOption

Searchable single/multiple selector built from a styled trigger, `NvAutocomplete`, standalone `NvOption` rows and fixed-size `NvTag` chips. This document distinguishes public props, option data and styled/fallthrough states; they are not interchangeable.

## Units and source scope

Geometry produced by `polished.rem()` and the CSS helpers is in **rem**, with pixel equivalents below assuming a **16px root font size**. Numeric positioning offsets and SVG dimensions are passed as CSS-pixel numbers; they do not automatically scale with rem geometry. Line-height `1.4` is unitless; tracking `0.32px` is emitted as `0.02rem`. The docs describe the existing implementation, including limitations, not a redesigned control. Theme values are resolved from the real token/theme/helper inventory; `darken(0.0675, #444444)` resolves to `#333` (`#333333`). Browser resets and third-party behavior are identified separately rather than assigned invented appearances.

## Source Files Used

- [NvSelect.vue](./NvSelect.vue): trigger composition, search, grouping, models and event wiring.
- [NvOption.vue](./NvOption.vue): independent option component and hover slot scope.
- [select.shared.ts](./select.shared.ts), [select.styled.ts](./select.styled.ts): prop/type surfaces and state branches.
- [select.stories.ts](./select.stories.ts): single and multiple examples; `labelKey` is not a declared prop.
- [Autocomplete](../Autocomplete/README.md), [Tag](../Tag/README.md), [NvIcon.vue](../../typography/Icon/NvIcon.vue), [Stack](../../miscellaneous/Stack/stack.shared.ts), [Group](../../miscellaneous/Group/group.shared.ts): delegated contracts.
- [CSS helpers](../../../utils/css-in-js.ts): `fontSizeStyle`, radius/padding/icon-position helpers.
- [Light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts), and [global stylesheet](../../../styles/main.scss).

## Component Axes: NvSelect

| Property                | Type / values        | Default          | Actual use                                                                                                                                      |
| ----------------------- | -------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`                  | `sm`, `md`, `lg`     | `md`             | Trigger geometry/type and direction icon; not popup, rows or tags.                                                                              |
| `multiple`              | boolean              | `false`          | Scalar selection vs array toggle. **Initialize model to `[]` before enabling multiple.**                                                        |
| `modelValue`            | `Value` or `Value[]` | undefined        | `Value = string \| number \| boolean \| object \| null \| undefined`; runtime constructors are String, Number, Object, Array (Boolean missing). |
| `options`               | `Option[]`           | fresh `[]`       | Group-aware source flattened one level.                                                                                                         |
| `valueKey`              | string               | `''`             | Lodash path used for identity comparisons; fallback differences are documented below.                                                           |
| `isFocused`             | boolean              | `false`          | Declared, but visible trigger styling is bound to local focus-trap `hasFocus`, overriding this value.                                           |
| `autocompleteWidth`     | number               | undefined        | Passed to Autocomplete minimum-width calculation, **not fixed popup width**.                                                                    |
| `placeholder` attribute | not a declared prop  | no local default | Explicitly read from `$attrs.placeholder` for the styled native input.                                                                          |

Whole-select disabled, readonly, loading, invalid and selected Boolean variants are not authored. Arbitrary attributes fall through to the Autocomplete root wrapper; they are **not** all bound to the input. A root `disabled` or `readonly` attribute does not establish supported native input semantics.

### Option data fields

| Field in exported `Option` | Type                                        | Actual interpretation                                                                                     |
| -------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `label`                    | required string                             | Row text and title; selected single label/chip label.                                                     |
| `value`                    | optional `Value`                            | Model payload.                                                                                            |
| `id`                       | optional `Value` excluding object           | Explicit id retained; otherwise generated from truthy extracted value / value / UUID.                     |
| `disabled`                 | optional boolean                            | Passed to row CSS; keyboard selection is **not** guarded.                                                 |
| `readonly`                 | optional boolean                            | Exported data field but **ignored by normal Select row binding**. Readonly binds `item.children` instead. |
| `category`, `searchValue`  | optional strings                            | Fuse search keys along with label.                                                                        |
| `children`                 | optional `Omit<Option, 'children'>[]`       | Parent becomes header; children flattened below it, one level only. Even empty array is truthy.           |
| `attr`                     | optional `Record<string, number \| string>` | Declared singular spelling; Vue actually reads **`item.attrs`**, plural. Source mismatch.                 |

Runtime `item.attrs` is bound after explicit row flags/title and can override those props. Such overrides change styled appearance, not the selection callbacks: those guard only `item.children` and do not check `item.disabled` or readonly. No undocumented guarantee of readonly behavior should be inferred from attribute overrides.

### Standalone NvOption states

| Input      | Declared by `NvOption` / `OptionProps`? | Styled child default | Delivery                                       |
| ---------- | --------------------------------------- | -------------------- | ---------------------------------------------- |
| `active`   | Yes, Boolean default `false`            | `false`              | Explicitly forwarded props.                    |
| `selected` | No                                      | Boolean `false`      | Vue fallthrough attribute to `StSelectOption`. |
| `disabled` | No                                      | Boolean `false`      | Same fallthrough route.                        |
| `readonly` | No                                      | Boolean `false`      | Same fallthrough route.                        |

Standalone Option has no size, value/model or selection event API. Its state flags are visual controls, not a complete accessible selection primitive. Native row listeners/attributes fall through; `NvOption` declares no emits.

## Size Specification

| Trigger size | Min-height        | Native styled input height | Padding left / right | Padding top / bottom | Radius | Font / line-height / tracking | Direction icon    | Icon right |
| ------------ | ----------------- | -------------------------- | -------------------- | -------------------- | ------ | ----------------------------- | ----------------- | ---------- |
| `sm`         | `24px` (`1.5rem`) | **`16px`** (`1rem`)        | **`8px / 24px`**     | `4px / 4px`          | `6px`  | `12px / 1.4 / 0.32px`         | **`16px × 16px`** | `4px`      |
| `md`         | `32px` (`2rem`)   | `24px` (`1.5rem`)          | **`16px / 32px`**    | `4px / 4px`          | `8px`  | `12px / 1.4 / 0.32px`         | **`24px × 24px`** | `4px`      |
| `lg`         | `40px` (`2.5rem`) | `32px` (`2rem`)            | **`24px / 40px`**    | `4px / 4px`          | `8px`  | `14px / 1.4 / 0.32px`         | **`24px × 24px`** | `8px`      |

These are authored minimum heights, not guaranteed fixed outer heights: chips/content can grow the trigger. Trigger is relative inline-flex, center-aligned, pointer cursor, `w-full`, border width `1px`, `transition: all .3s`. Wrapper has `margin-top/bottom: -1px`, flex center and weight `600`; input inherits font size/weight/tracking, width 100%, outline none and pointer cursor. Font family is inherited on the trigger/input, not explicitly set by Select. Direction icon uses `currentColor`; its wrapper is absolute inline-flex with pointer events none, no authored top/transform offset.

### Nested geometry (all trigger sizes)

| Part            | Actual defaults / geometry                                                                                                                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Popup           | Select does not forward `size`: **Autocomplete `md` radius `8px`**. `bottom-end`, flip, collision padding `8px`, offset `12px`, z-index `9999`; minimum `max(reference, 300px)` absent truthy override, reference CSS width, border `1px`, shadow token and rounded clipping. |
| Popup list      | Maximum `200px`; virtual estimate `32px`, overscan `5`.                                                                                                                                                                                                                       |
| Option row      | Width 100%, height **`32px !important`**, padding **`0 16px !important`**, flex center / space-between, min-width 0, nowrap, overflow hidden and text-overflow ellipsis. No authored border, radius or shadow.                                                                |
| Option type     | `defaultTextStyle`: Nunito/system sans, **`14px`**, line-height `1.4`, tracking `0.32px`, theme.text.color. No normal font-weight authored; selected adds `700`.                                                                                                              |
| Content / after | Content relative, min-width 0, z-index 0; Select's inner label has `w-full text-ellipsis overflow-hidden`. After wrapper flex-shrink 0; each direct child has left margin `8px`.                                                                                              |
| Chips           | NvTag fixed `24px` high, closable padding `8px / 24px`; **tag wrapper margin-left `-12px`** (`-spacing[4]`). Group gap `4px`, row direction, wrapping enabled, center aligned, no grow.                                                                                       |
| Inner Stack     | spacing `2` = **`4px`**, column, stretch, flex-start; contains chips and input wrapper.                                                                                                                                                                                       |
| No Data         | StSelectOption empty-result row with `justify-center pointer-events-none`; literal `No Data`; no separate disabled text style.                                                                                                                                                |

## Variant And State Style Tables

### Trigger surface

| Theme | State       | Text / icon | Fill      | Border (`1px`) | Shadow              |
| ----- | ----------- | ----------- | --------- | -------------- | ------------------- |
| light | rest        | `#444444`   | `#ffffff` | `#EBEBEB`      | None authored.      |
| light | hover       | `#444444`   | `#ffffff` | **`#DCDCDC`**  | None authored.      |
| light | local focus | `#444444`   | `#ffffff` | **`#DCDCDC`**  | `0 0 0 4px #F9F9FC` |
| dark  | rest        | `#DCDCDC`   | `#333333` | `#444444`      | None authored.      |
| dark  | hover       | `#DCDCDC`   | `#333333` | `#626262`      | None authored.      |
| dark  | local focus | `#DCDCDC`   | `#333333` | `#626262`      | `0 0 0 4px #444444` |

Sources are `theme.select.color/backgroundColor/borderColor/hover.borderColor/focus.borderColor/focus.boxShadow`; placeholder source is `theme.select.placeholder.color`: light `#BEBEBE`, dark `#818181`, weight `300`, inherited size/tracking. Focus is local `hasFocus`, not `:focus` on the div. Hover is a pseudo-class and the two interactions can coexist (their borders resolve equally here). No pressed or selected trigger fill is authored.

### Option surface (standalone or in Select)

| Theme | State                  | Text          | Fill                                         | Weight                         | Additional effects                         |
| ----- | ---------------------- | ------------- | -------------------------------------------- | ------------------------------ | ------------------------------------------ |
| light | rest                   | `#444444`     | No authored row fill; transparent over popup | Inherited                      | None.                                      |
| light | hover                  | `#444444`     | `#F9F9FC`                                    | Inherited                      | None.                                      |
| light | selected               | `#444444`     | `#EBEBEB`                                    | `700`                          | None.                                      |
| light | active (keyboard flag) | `#444444`     | **`#DCDCDC`**                                | Inherited unless also selected | None.                                      |
| light | disabled               | **`#BEBEBE`** | No authored row fill                         | Inherited                      | Pointer-events none; user-select none.     |
| light | readonly               | `#BEBEBE`     | No authored row fill                         | Inherited                      | Separator `#EBEBEB`; label mask `#ffffff`. |
| dark  | rest                   | `#DCDCDC`     | No authored row fill; transparent over popup | Inherited                      | None.                                      |
| dark  | hover                  | `#DCDCDC`     | `#444444`                                    | Inherited                      | None.                                      |
| dark  | selected               | `#DCDCDC`     | `#515151`                                    | `700`                          | None.                                      |
| dark  | active (keyboard flag) | `#DCDCDC`     | `#2B2B2C`                                    | Inherited unless also selected | None.                                      |
| dark  | disabled               | **`#9F9F9F`** | No authored row fill                         | Inherited                      | Pointer-events none; user-select none.     |
| dark  | readonly               | `#9F9F9F`     | No authored row fill                         | Inherited                      | Separator `#626262`; label mask `#333333`. |

`defaultTextStyle` supplies normal text from `theme.text.color`; row interaction fills use `theme.select.option.hover/selected/active.backgroundColor`. Disabled styling unusually assigns **`theme.select.option.disabled.backgroundColor` to CSS color**, not fill. Readonly uses `.readonly.color/borderColor`; the mask uses `.option.backgroundColor`. Theme option border/focus keys exist but are not applied as a general row border/focus ring. Interaction fills and disabled/readonly colors are `!important`.

### Compound precedence

1. **Readonly first**, then **disabled**, then the normal interaction branch. Readonly+disabled gets readonly appearance and **does not get the disabled pointer-events/user-select rule**. Neither branch gets the selected 700 weight or selected/active/hover fills from the normal branch.
2. In the normal branch, selected+active has **active fill** (later declaration) and weight `700` from selected.
3. The normal `:hover` selector has greater specificity than base selected/active declarations; while pointer-hovered, **hover fill wins**, including over keyboard-active or selected fill. Selected weight remains `700`.
4. Readonly adds a full-width `1px` line at top `50%`, translated `-50%`, z-index `-1` inside a relative z-index-0 row. Content has a mask pseudo-element inset `-4px`, z-index `-1`; it covers the line beneath the label. Cursor becomes auto. No pointer-event blocking is authored for readonly alone.

## Slots, Events and model flow

| Component / contract         | Payload / scope                   | Actual behavior                                                                                                                                 |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| NvSelect `optionAfter` slot  | `{ option, hover }`               | Consumer trailing row content; hover is NvOption's `useElementHover` state. No Select default/reference/fallback forwarding contract.           |
| NvSelect `update:modelValue` | scalar value or updated array     | Single emits value then clears search, deactivates focus trap and closes; multiple toggles value without automatically clearing search/closing. |
| NvOption default slot        | no scope                          | Row label/content.                                                                                                                              |
| NvOption `after` slot        | `{ hover }`                       | Always renders after wrapper; content consumer-defined.                                                                                         |
| NvOption native listeners    | normal DOM events via fallthrough | No declared select/change event or model.                                                                                                       |

Clicking trigger or focusing input activates focus trap. It allows outside clicks, prevents scroll and does not restore focus on deactivate. Local `hasFocus=true` opens popup; `blurInput` clears search, deactivates and hides it. Outside pointer/focus/interact events invoke blur; Escape and Tab key hooks invoke blur, without a local `preventDefault` in that handler. Autocomplete's default `selectOnTab=false` is not overridden. Group headers are not selected by Select's pointer or keyboard callbacks because those only check `!item.children`. Tag close toggles its option; tag mousedown blurs first and click is stopped, so chip close can close the popup despite the general multiple selection flow.

Fuse keys are `label`, `category`, `searchValue`, threshold `0.3`, `shouldSort=false`. No search returns all flattened rows; search retains original option order and includes a header only when a child result matches. Unfocused single `inputValue` is the selected option label or search; focused/multiple uses search. Auto-scroll is the minimum matching index over selected values; `findIndex=-1` is not filtered out (only undefined is removed), and an empty multiple selection yields a falsy value rather than a valid numeric index.

## Existing implementation quirks / reconstruction caveats

- **Disabled keyboard selection:** disabled CSS prevents pointer events, but Autocomplete highlights disabled rows and Select's keyboard callback does not check `item.disabled`. Enter can emit a disabled option's value. Do not describe disabled as unselectable in all input modes.
- **Falsy selected appearance:** row `selected` receives `.find(...)`'s returned value, not a Boolean match. Selected `0`, `false`, `''`, `null` or `undefined` can lack selected styling. Boolean values are included in TS but not runtime prop constructors.
- **Readonly mismatch:** exported `Option.readonly` is not used by normal row bindings. Only truthy `children` marks a normal group header readonly; handlers guard children, not readonly. Standalone readonly styling itself does not prevent native handlers.
- **Multiple model precondition:** there is no undefined-to-array normalization. `.map`, `.length` and spread expect an array; undefined/null/non-array multiple models can fail. Initialize `[]` and update the controlled model from the event.
- **Identity quirks:** row selected comparisons/generated ids/chip keys use truthy `get(...) || value` fallbacks; selectedOptions and toggle matching use Lodash's default-value form instead. Falsy path values and UUID-generated ids can therefore behave differently. Invalid selection indices and an empty keyboard result can emit undefined from Autocomplete; Select dereferences `item.children` without an undefined guard.
- **Native input binding caveat:** template passes `modelValue` and listens for `update:modelValue` on `StSelectInput`, which is a styled native `input`; there is no authored native `@input` handler or explicit `value` binding here. Source alone does not prove the intended displayed-label/search update wiring works in a browser. Do not treat the computed search/label values as a browser-verified contract.
- Imported Element Plus option CSS does not make these rows `ElOption`; they are styled divs. No vendor option padding, focus ring, ARIA roles, selected checkmark or whole-select disabled appearance is inferred. No row tab index/keyboard handler or local ARIA selection semantics is authored by NvOption.

## Token Mapping / Recommended Figma Mapping

Trigger geometry resolves from `spacing[6/7/8]=24/32/40`, input heights `spacing[5/6/7]=16/24/32`, vertical padding `spacing[2]=4`, horizontal reserves via the shared icon-padding helper, radii `sm/md/DEFAULT=6/8/8`, type `fontSize[1/2]=12/14`, wrapper offsets `-borderWidth.DEFAULT=-1` and chips `-spacing[4]=-12`. NvIcon keys `3/5/5` resolve through **fontSize**, not spacing: `16/24/24px`. Border/focus spread are `borderWidth.DEFAULT/lg=1/4`.

Use Trigger `Size`, `Theme`, local `State=rest/hover/focus`, and `Mode=single/multiple`; preserve growing height and the actual nested defaults instead of propagating trigger size. Build Option separately with active/selected/disabled/readonly controls and compound precedence above, consumer after slot, clipping and masked readonly separator. Reproduce existing model/appearance quirks as caveats, not idealized additional supported variants. Keep popup clipping/shadow on the shell, scroll viewport separate, and chips on a wrapping 4px-gap row with the actual -12px offset.
