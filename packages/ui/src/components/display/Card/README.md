# NvCard Design Spec

Purpose: container surface for display content with size-based padding and a `default` or translucent `transparent` background.

## Source Files Used

| File                                 | Purpose                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `NvCard.vue`                         | Public component shell and slot structure                      |
| `card.shared.ts`                     | Public props, defaults, and supported values                   |
| `card.styled.ts`                     | Size, background, radius, shadow, and base styling             |
| `card.stories.ts`                    | Storybook evidence for supported size control and content slot |
| `packages/ui/src/themes/light.ts`    | Light theme card colors                                        |
| `packages/ui/src/themes/dark.ts`     | Dark theme card colors                                         |
| `packages/design-tokens/src/main.ts` | Token definitions for spacing, radius, and shadow              |

## Component Axes

| Property  | Kind       | Values                   | Default   | Notes                                        |
| --------- | ---------- | ------------------------ | --------- | -------------------------------------------- |
| `size`    | enum prop  | `xs`, `sm`, `md`         | `md`      | Changes container padding only.              |
| `variant` | enum prop  | `default`, `transparent` | `default` | Changes background fill only.                |
| `content` | slot       | default slot             | N/A       | All visible content is provided by children. |
| `theme`   | contextual | `light`, `dark`          | App theme | Affects background colors for both variants. |

## Size Specification

| Size | Height    | Min width | Padding X                     | Padding Y                     | Gap       | Radius                                  | Border width | Typography                                                                       | Icon size | Notes                               |
| ---- | --------- | --------- | ----------------------------- | ----------------------------- | --------- | --------------------------------------- | ------------ | -------------------------------------------------------------------------------- | --------- | ----------------------------------- |
| `xs` | Not found | Not found | `spacing.2` (4px / `0.25rem`) | `spacing.2` (4px / `0.25rem`) | Not found | `borderRadius.DEFAULT` (8px / `0.5rem`) | `0` / none   | Container sets `font-size: 0`; child typography must be supplied by slot content | N/A       | Size rule comes from `styleBySize`. |
| `sm` | Not found | Not found | `spacing.3` (8px / `0.5rem`)  | `spacing.3` (8px / `0.5rem`)  | Not found | `borderRadius.DEFAULT` (8px / `0.5rem`) | `0` / none   | Container sets `font-size: 0`; child typography must be supplied by slot content | N/A       | Matches base padding declaration.   |
| `md` | Not found | Not found | `spacing.5` (16px / `1rem`)   | `spacing.5` (16px / `1rem`)   | Not found | `borderRadius.DEFAULT` (8px / `0.5rem`) | `0` / none   | Container sets `font-size: 0`; child typography must be supplied by slot content | N/A       | Default size.                       |

## Variant And State Styles

### Light Theme

| Theme   | Variant       | State  | Text color      | Icon color | Background / fill                                                                                                                                     | Border / stroke | Shadow / effects                                                | Radius                                  | Opacity                 | Notes                                                                               |
| ------- | ------------- | ------ | --------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- | --------------------------------------- | ----------------------- | ----------------------------------------------------------------------------------- |
| `light` | `default`     | `rest` | Not set locally | N/A        | `theme.card.backgroundColor` -> `colors.white` (`#ffffff`)                                                                                            | none            | `boxShadow.DEFAULT` (`0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`) | `borderRadius.DEFAULT` (8px / `0.5rem`) | `1`                     | No hover, focus, active, selected, disabled, or loading styles are defined locally. |
| `light` | `transparent` | `rest` | Not set locally | N/A        | `rgba(theme.card.transparent.backdropColor, theme.card.transparent.backdropOpacity)` -> `rgba(249,249,252,0.95)` from `gray.10` (`#F9F9FC`) at `0.95` | none            | `boxShadow.DEFAULT` (`0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`) | `borderRadius.DEFAULT` (8px / `0.5rem`) | `0.95` background alpha | Uses a translucent light backdrop.                                                  |

### Dark Theme

| Theme  | Variant       | State  | Text color      | Icon color | Background / fill                                                                                                                                  | Border / stroke | Shadow / effects                                                | Radius                                  | Opacity                 | Notes                                 |
| ------ | ------------- | ------ | --------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------- | --------------------------------------- | ----------------------- | ------------------------------------- |
| `dark` | `default`     | `rest` | Not set locally | N/A        | `theme.card.backgroundColor` -> `darken(0.0675)(gray.80)` -> `#333`                                                                                | none            | `boxShadow.DEFAULT` (`0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`) | `borderRadius.DEFAULT` (8px / `0.5rem`) | `1`                     | Theme value is computed in `dark.ts`. |
| `dark` | `transparent` | `rest` | Not set locally | N/A        | `rgba(theme.card.transparent.backdropColor, theme.card.transparent.backdropOpacity)` -> `rgba(43,43,44,0.95)` from `gray.90` (`#2B2B2C`) at `0.95` | none            | `boxShadow.DEFAULT` (`0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`) | `borderRadius.DEFAULT` (8px / `0.5rem`) | `0.95` background alpha | Uses a translucent dark backdrop.     |

## Structure / Anatomy

| Part           | Source of truth              | Visual role                    | Relevant styling                                           | Export note                                                    |
| -------------- | ---------------------------- | ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------- |
| card container | `StCard` in `card.styled.ts` | Surface and spacing container  | Background, padding, radius, shadow, `font-size: 0`        | Main Figma frame. Apply size and variant styles here.          |
| content slot   | Default slot in `NvCard.vue` | Arbitrary child content region | No direct styling besides inheriting the container surface | Model as freeform nested content, not as a fixed subcomponent. |

## Token Mapping

| Concern                | Token                                                                             | Resolved value                                              | Where used                                            |
| ---------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| Card padding `xs`      | `spacing.2`                                                                       | 4px / `0.25rem`                                             | `styleBySize.xs.padding`                              |
| Card padding `sm`      | `spacing.3`                                                                       | 8px / `0.5rem`                                              | `styleBySize.sm.padding` and base padding declaration |
| Card padding `md`      | `spacing.5`                                                                       | 16px / `1rem`                                               | `styleBySize.md.padding`                              |
| Radius                 | `borderRadius.DEFAULT`                                                            | 8px / `0.5rem`                                              | `border-radius`                                       |
| Shadow                 | `boxShadow.DEFAULT`                                                               | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`                   | `box-shadow`                                          |
| Light default fill     | `theme.card.backgroundColor`                                                      | `colors.white` (`#ffffff`)                                  | Light `default` variant background                    |
| Light transparent fill | `theme.card.transparent.backdropColor` + `theme.card.transparent.backdropOpacity` | `gray.10` (`#F9F9FC`) at `0.95` -> `rgba(249,249,252,0.95)` | Light `transparent` variant background                |
| Dark default fill      | `theme.card.backgroundColor`                                                      | `darken(0.0675)(gray.80)` -> `#333`                         | Dark `default` variant background                     |
| Dark transparent fill  | `theme.card.transparent.backdropColor` + `theme.card.transparent.backdropOpacity` | `gray.90` (`#2B2B2C`) at `0.95` -> `rgba(43,43,44,0.95)`    | Dark `transparent` variant background                 |

## Recommended Figma Mapping

| Figma property | Type                  | Suggested values         | Derived from                      |
| -------------- | --------------------- | ------------------------ | --------------------------------- |
| `Variant`      | variant               | `default`, `transparent` | `variant` prop                    |
| `Size`         | variant               | `xs`, `sm`, `md`         | `size` prop                       |
| `Theme`        | variant               | `light`, `dark`          | Theme-dependent background values |
| `Content`      | slot / nested content | freeform                 | Default slot in `NvCard.vue`      |

## Layout, Typography And Effects Context

- `card.shared.ts:6–15` declares exactly `size` and `variant`; `NvCard.vue:1–12` renders one `StCard` and one default slot. There is no header/title/footer/icon/action anatomy, named slot or interactive behavior. Consumer attrs/classes/styles can still override the shell.
- Root is a block div by default (`card.styled.ts:24–38`), not a flex/stack layout. No width/height/min/max dimensions, margin, gap, internal alignment or border is declared; normal block sizing follows parent/content. Padding applies on all four sides. Radius **stays `borderRadius.DEFAULT = .5rem` (8px at a 16px document root) at xs, sm and md**; sizes only change padding.
- The `//overflow: hidden;` line is commented out, not an active clipping rule. Pinned `vue3-styled-components@1.2.1` `src/models/ComponentStyle.js:24–32` strips `//` comment lines before generating CSS. Default overflow is visible; the rounded background does not clip children. There is no blur/backdrop-filter, focus outline, transition or whole-card opacity rule. Transparent mode changes **fill alpha .95**, not the opacity of card or children (element opacity remains 1 absent consumer overrides).
- `boxShadow.DEFAULT` is the exact string `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` for every size/variant/theme. Preserve `.063rem` rather than rounding it to a presumed 1px. Rem geometry scales with document root size; pixel labels throughout this README assume 16px root. Shared Tailwind preflight applies border-box sizing when package global styles are loaded.
- Root explicitly sets **font-size 0**. Raw text/default-story interpolation can therefore have zero-sized glyphs; a child merely inheriting font-size is not restored automatically. An NvText or another child with explicit font-size establishes its own text style. Do not claim arbitrary slot children have a fixed font or visible text size.
- Root does not declare font-family, line-height, weight, letter-spacing, transform, decoration, text-align or foreground. Package Tailwind preflight plus `packages/ui/tailwind.config.cjs` supplies the sans stack `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` and default root line-height 1.5; parent context can replace them. Color is the nearest ancestor/native context, not `theme.text.color` unless such a parent/child explicitly uses it. Weight/spacing default normal, no transform/decoration and start alignment apply absent ancestor overrides; no icon styling is imposed. This inheritance is intentionally not assigned a fake light/dark Card foreground.
- Storybook's provider in `packages/ui/.storybook/preview.js` supplies dark theme as demo context, not a default Card theme prop. The story exposes size and raw content; source additionally supports transparent variant.

## Figma Build Notes

Use one block surface frame with four-sided padding and fixed 8px radius across sizes. Apply the fill and shadow to that frame; keep content freeform, without inventing a stack direction/gap or clip. Keep `.95` on transparent fill only. Explicitly set typography on visible nested content rather than inheriting root font-size 0. No interactive state, fixed height, icon or semantic region should be inferred from generic Card conventions.

## Gaps / Assumptions

| Item                                                         | Status                                                                                                                                                                |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hover, focus, active, selected, disabled, and loading states | Unsupported in local source; only rest state is evidenced.                                                                                                            |
| Explicit text styles for card content                        | Not found. Typography is delegated to whatever is rendered in the default slot.                                                                                       |
| Fixed dimensions, min width, or internal layout gap          | Not found. The card only defines padding and surface styling.                                                                                                         |
| Border styling                                               | Unsupported locally; no border color or border width is defined.                                                                                                      |
| `font-size: 0` intent                                        | Implementation is explicit, but the reason is not documented in source. Designers should preserve child typography on nested content layers instead of the container. |
