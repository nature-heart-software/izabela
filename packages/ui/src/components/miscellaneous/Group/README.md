# NvGroup Design Spec

Flex layout with optional wrapping and direct-child growth. Source: [NvGroup.vue](./NvGroup.vue), [props](./group.shared.ts), [styles](./group.styled.ts), [stories](./group.stories.ts).

## Component Axes

| Property    | Values                                       | Default  | Source behavior                                                                   |
| ----------- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------- |
| `direction` | `row`, `column`                              | `row`    | Main axis of `flex-flow`.                                                         |
| `spacing`   | Token keys `1`–`16`                          | `3`      | `gap: rem(tokens.spacing[spacing])`.                                              |
| `justify`   | `left`, `center`, `right`, `apart`, `around` | `left`   | Direction-dependent mapping below.                                                |
| `align`     | `stretch`, `center`, `start`, `end`          | `center` | Raw `align-items` value in row; entirely ignored in column.                       |
| `noWrap`    | Boolean                                      | `false`  | False → `wrap`; true → `nowrap`.                                                  |
| `grow`      | Boolean                                      | `false`  | Direct children receive `flex-grow: 0` or `1`; column growth also forces stretch. |
| `as`        | HTML tag string                              | `div`    | Styled host tag, not a separate geometry variant.                                 |

## Direction × Grow × Justify Matrix

The five entries in each cell are ordered **left / center / right / apart / around**. This covers all 20 direction × grow × justify combinations; every column combination ignores `align`.

| Direction | Grow  | `justify-content` for the five values                           | `align-items` for the five values                                      | Direct-child rule |
| --------- | ----- | --------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------- |
| row       | false | `flex-start / center / flex-end / space-between / space-around` | Raw `align` for all five (default `center`)                            | `flex-grow: 0`    |
| row       | true  | `flex-start / center / flex-end / space-between / space-around` | Raw `align` for all five (default `center`)                            | `flex-grow: 1`    |
| column    | false | Not emitted for any value                                       | `flex-start / center / flex-end / flex-start / space-around (INVALID)` | `flex-grow: 0`    |
| column    | true  | Not emitted for any value                                       | `stretch / stretch / stretch / stretch / stretch`                      | `flex-grow: 1`    |

- Column `apart` is explicitly remapped to **flex-start**, not space-between. It does not distribute children vertically.
- Column `around` without growth emits **`align-items: space-around`**, invalid CSS. The browser discards the declaration; another applicable cascade rule can win, otherwise initial `normal` applies (stretch-like in a flex context). `align-items` is **not inherited**. Do not draw horizontal space-around distribution as if the CSS worked.
- Column `grow=true` overrides every justify value with stretch, including the invalid case; it still does not emit `justify-content`.
- Row `align=start/end` is emitted literally, not normalized to flex-start/flex-end. These are valid CSS alignment values with logical alignment semantics.
- `flex-grow: 1` distributes available main-axis free space in addition to each child’s flex basis. It does not set `flex-basis: 0`, force equal total sizes, or constrain intrinsic minimums.

## Size Specification / Token Mapping

All `rem()` values use Polished’s default 16px conversion base. Pixel equivalents below assume a 16px document root; a different root scales rem geometry, not literal px geometry. No fixed container size is implied.

| Key  | Token number | Emitted gap | At 16px root |
| ---- | ------------ | ----------- | ------------ |
| `1`  | 2            | `0.125rem`  | 2px          |
| `2`  | 4            | `0.25rem`   | 4px          |
| `3`  | 8            | `0.5rem`    | 8px          |
| `4`  | 12           | `0.75rem`   | 12px         |
| `5`  | 16           | `1rem`      | 16px         |
| `6`  | 24           | `1.5rem`    | 24px         |
| `7`  | 32           | `2rem`      | 32px         |
| `8`  | 40           | `2.5rem`    | 40px         |
| `9`  | 48           | `3rem`      | 48px         |
| `10` | 64           | `4rem`      | 64px         |
| `11` | 80           | `5rem`      | 80px         |
| `12` | 96           | `6rem`      | 96px         |
| `13` | 112          | `7rem`      | 112px        |
| `14` | 128          | `8rem`      | 128px        |
| `15` | 144          | `9rem`      | 144px        |
| `16` | 160          | `10rem`     | 160px        |

Root CSS sets `display:flex`, `flex-flow`, alignment, and gap only. No fixed width, height, min-width, padding, radius, border, shadow, or clipping is specified. Story height `300px` and child `!h-auto` classes are demonstration context, not defaults. Gap applies between items and wrapped lines; distribution needs available space in the container.

## Variant And State Styles

Light and dark use identical component layout rules. The wrapper assigns no text color, font, fill, border, opacity, icon treatment, or effects; text typography/color can inherit and slotted components style themselves. No interactive state styles or event-driven visual variants exist.

## Structure / Anatomy And Contracts

`NvGroup.vue` passes props to the styled host and renders one unscoped default slot. Only immediate child elements receive the `flex-grow` selector; nested descendants do not. No custom emits or exposed methods are declared.

## Recommended Figma Mapping

Use an auto-layout frame with Direction, spacing, Wrap (inverse of `noWrap`), and child growth annotations. Apply Justify and Align according to the matrix, not their names. In columns, suppress Align as an effective visual control; `apart` looks like `left`, and growing columns share stretch regardless of Justify. Annotate the invalid non-growing `around` rule rather than repairing it in the design. Child grow is free-space growth, not a promise of identical child dimensions.

## Context / Remaining Uncertainties

Invalid column-around appearance depends on applicable consumer CSS; the source exception itself is resolved. Final dimensions, child intrinsic sizes, logical writing context, and available free space are consumer-defined. No missing theme values remain.

## Supporting Sources

Mapping and precedence: `group.styled.ts:8–38`; all defaults: `group.shared.ts:18–40`; preview geometry: `group.stories.ts:57–60`. Spacing: [design tokens](../../../../../design-tokens/src/main.ts), lines 51–68.
