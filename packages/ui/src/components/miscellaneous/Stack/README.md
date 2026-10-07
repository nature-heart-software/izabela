# NvStack Design Spec

A vertical flex layout, not an overlay or z-axis stack. Source: [NvStack.vue](./NvStack.vue), [props](./stack.shared.ts), [styles](./stack.styled.ts), [stories](./stack.stories.ts).

## Component Axes

| Property  | Values                                       | Default   | Effect                                      |
| --------- | -------------------------------------------- | --------- | ------------------------------------------- |
| `spacing` | Token keys `1`–`16`                          | `3`       | Gap between children.                       |
| `align`   | `start`, `center`, `end`, `stretch`          | `stretch` | Cross-axis (normally horizontal) alignment. |
| `justify` | `left`, `center`, `right`, `apart`, `around` | `left`    | Main-axis (normally vertical) distribution. |
| `as`      | HTML tag string                              | `div`     | Styled host tag.                            |

## Exact Layout Mapping

The root always emits `display:flex; flex-direction:column`. It does not declare `flex-wrap`; absent an override, flex wrapping is the initial `nowrap`. There are no direction, wrap, or grow props.

| `justify` | Emitted `justify-content` | Meaning in normal horizontal writing mode |
| --------- | ------------------------- | ----------------------------------------- |
| `left`    | `flex-start`              | Start/top                                 |
| `center`  | `center`                  | Center                                    |
| `right`   | `flex-end`                | End/bottom                                |
| `apart`   | `space-between`           | Free space between children               |
| `around`  | `space-around`            | Free space around children                |

| `align`   | Emitted `align-items` |
| --------- | --------------------- |
| `start`   | `flex-start`          |
| `center`  | `center`              |
| `end`     | `flex-end`            |
| `stretch` | `stretch`             |

Unlike Group’s raw row alignment and exceptional column justification, Stack normalizes both axes through `POSITIONS`; all listed mappings are valid. Stretch fills the cross axis only where child sizing constraints allow. Distribution requires free main-axis space; content-height stacks will not acquire story-sized space automatically.

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

Default gap is `0.5rem` (8px at a 16px root). Width, height, min-width, padding, border, radius, fill, shadow, opacity, typography, and clipping are not assigned by Stack CSS. Story height `300px` and button `!h-auto` are preview-only. Children keep their own flex sizing; this component adds no child selector or growth rule.

## Variant And State Styles

The component has no theme-specific styles or interactive visual states. Text color and typography are inherited where children do not override them; child icons, backgrounds, and effects are their own contracts, not Stack defaults.

## Structure / Anatomy And Contracts

One styled host with one unscoped default slot. No declared custom emits or exposed methods. No implied width or intrinsic component row height is assigned to child content.

## Recommended Figma Mapping

Use vertical auto layout with spacing, mapped cross-axis Align, and mapped vertical Justify. Annotate `left=top` and `right=bottom` rather than treating them as unresolved naming. Do not create Direction, Grow, Wrap, Theme, or interactive-state variants absent from this primitive’s visual contract. Child fill-width behavior should respect actual stretch and size constraints.

## Context / Remaining Uncertainties

Final frame dimensions, child constraints, and available free space come from the consumer. Logical axis direction can vary with writing mode. These are integration inputs, not unresolved token values.

## Supporting Sources

`stack.shared.ts:5–34`; `stack.styled.ts:8–26`; `stack.stories.ts:36–45`. [Design tokens](../../../../../design-tokens/src/main.ts), lines 51–68, provide the spacing scale.
