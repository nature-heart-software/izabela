# NvDivider Design Spec

An empty separator host, not an interactive component. Source: [NvDivider.vue](./NvDivider.vue), [props](./divider.shared.ts), [styles](./divider.styled.ts), [stories](./divider.stories.ts).

## Component Axes

| Property    | Values                   | Runtime default | Effect                          |
| ----------- | ------------------------ | --------------- | ------------------------------- |
| `direction` | `vertical`, `horizontal` | `vertical`      | Right border versus top border. |

The Storybook control starts at `horizontal`; this is a preview choice, not an ambiguous runtime default. The Vertical story supplies `class="h-64"`; that class is consumer sizing, not intrinsic separator length.

## Size Specification

All `rem()` values use Polished’s default 16px conversion base. Pixel equivalents below assume a 16px document root; a different root scales rem geometry, not literal px geometry. No fixed container size is implied.

| Orientation          | Emitted border                                | Display                                            | Length / sizing                                                                                                                                           |
| -------------------- | --------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vertical` (default) | `border-right: 0.0625rem solid <theme color>` | `inline-flex`                                      | No explicit height or width; supply height or let surrounding layout stretch the host. An empty un-sized host does not guarantee a visible vertical line. |
| `horizontal`         | `border-top: 0.0625rem solid <theme color>`   | No explicit display override; default div is block | No explicit width or height; block width normally follows containing layout.                                                                              |

Thickness is 1px only at a 16px root. No padding, gap, radius, background, shadow, or typography is assigned by component CSS; shared reset and consumer styles remain contextual.

## Variant And State Styles / Token Mapping

| Theme | Token                                                 | Resolved color | Applies to        |
| ----- | ----------------------------------------------------- | -------------- | ----------------- |
| Light | `theme.divider.borderColor` → `tokens.colors.gray.20` | `#EBEBEB`      | Both orientations |
| Dark  | `theme.divider.borderColor` → `tokens.colors.gray.80` | `#444444`      | Both orientations |

The width is hard-coded `rem(1)`, not a spacing token. No hover, focus, active, disabled, selected, or visibility styles are implemented. Rest is the only documented appearance.

## Structure / Anatomy And Contracts

`NvDivider.vue` renders `StDivider`, an empty styled `div`. It declares no slots, emits, or exposed methods; no separator ARIA role is assigned by source. Theme changes border color only.

## Recommended Figma Mapping

Expose Direction (`vertical`, `horizontal`) and Theme (`light`, `dark`); default Direction is vertical. Put the stroke on the matching right or top edge and set separator length from the consuming layout. Do not add text, icons, interactive state variants, or a fixed length derived from a story.

## Context / Remaining Uncertainties

- Length is deliberately layout-defined, not an unresolved token. A final screen must specify its containing layout or sizing class.
- Shared CSS reset and consumer overrides may affect the host box. This spec records component declarations rather than promising zero values in every embedding.

## Supporting Sources

Theme values: [light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts). Conversion and primitives: [design tokens](../../../../../design-tokens/src/main.ts). Key rules: `divider.shared.ts:3–10`, `divider.styled.ts:8–16`, `divider.stories.ts:12–16,35–39`.
