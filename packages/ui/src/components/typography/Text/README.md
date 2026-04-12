# NvText Design Spec

- Purpose: render theme-aware body and heading-style text with a small set of semantic `type` variants.
- Source files used: `NvText.vue`, `text.shared.ts`, `text.styled.ts`, `text.stories.ts`

## Component Axes

| Property        | Kind                    | Values                                                        | Default   | Notes                                                                  |
| --------------- | ----------------------- | ------------------------------------------------------------- | --------- | ---------------------------------------------------------------------- |
| `type`          | enum                    | `caption`, `label`, `body-small`, `body`, `subtitle`, `title` | `body`    | Primary visual variant axis.                                           |
| `as`            | element selector        | Any HTML tag string                                           | `div`     | When `as="span"`, the component adds `display: inline-flex`.           |
| `align`         | text alignment          | CSS `text-align` values                                       | `''`      | Empty string means no explicit alignment style is emitted.             |
| `size`          | numeric token key       | `1`-`16` in Storybook                                         | `2`       | Exposed as a prop and story control, but not used in `text.styled.ts`. |
| content mode    | slot                    | Arbitrary inline / text content                               | Not found | Default slot only.                                                     |
| link decoration | embedded child selector | `a` descendants                                               | Not found | Nested anchors get an underline block via `::before`.                  |

## Size Specification

| Size / Type  | Height | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography                                                   | Icon size | Notes                                             |
| ------------ | ------ | --------- | --------- | --------- | --- | ------ | ------------ | ------------------------------------------------------------ | --------- | ------------------------------------------------- |
| `caption`    | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.1` = 12px / 1.4 / 0.32px                    | N/A       | Caption color override applied.                   |
| `label`      | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | Base typography with `fontWeight: 700`                       | N/A       | Inherits base font size from `tokens.fontSize.2`. |
| `body-small` | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.1` = 12px / 1.4 / 0.32px                    | N/A       | Same size as caption without caption color.       |
| `body`       | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.2` = 14px / 1.4 / 0.32px                    | N/A       | Default variant.                                  |
| `subtitle`   | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.2` = 14px / 1.4 / 0.32px; `fontWeight: 700` | N/A       | Same size as body, heavier weight.                |
| `title`      | N/A    | N/A       | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.4` = 18px / 1.4 / 0.32px; `fontWeight: 700` | N/A       | Largest documented text style in this folder.     |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| Light | `caption` | Rest | `theme.text.captionColor` = `colors.gray.60` (`#818181`) | same as text | None | none | None | N/A | 1 | Uses caption-specific color. |
| Light | `label` | Rest | `theme.text.color` = `colors.gray.80` (`#444444`) | same as text | None | none | None | N/A | 1 | Weight 700. |
| Light | `body-small` | Rest | `theme.text.color` = `colors.gray.80` (`#444444`) | same as text | None | none | None | N/A | 1 | Smaller text size. |
| Light | `body` | Rest | `theme.text.color` = `colors.gray.80` (`#444444`) | same as text | None | none | None | N/A | 1 | Base text style. |
| Light | `subtitle` | Rest | `theme.text.color` = `colors.gray.80` (`#444444`) | same as text | None | none | None | N/A | 1 | Weight 700. |
| Light | `title` | Rest | `theme.text.color` = `colors.gray.80` (`#444444`) | same as text | None | none | None | N/A | 1 | Weight 700, larger text size. |
| Dark | `caption` | Rest | `theme.text.captionColor` = `colors.gray.40` (`#BEBEBE`) | same as text | None | none | None | N/A | 1 | Uses caption-specific color. |
| Dark | `label` | Rest | `theme.text.color` = `colors.gray.30` (`#DCDCDC`) | same as text | None | none | None | N/A | 1 | Weight 700. |
| Dark | `body-small` | Rest | `theme.text.color` = `colors.gray.30` (`#DCDCDC`) | same as text | None | none | None | N/A | 1 | Smaller text size. |
| Dark | `body` | Rest | `theme.text.color` = `colors.gray.30` (`#DCDCDC`) | same as text | None | none | None | N/A | 1 | Base text style. |
| Dark | `subtitle` | Rest | `theme.text.color` = `colors.gray.30` (`#DCDCDC`) | same as text | None | none | None | N/A | 1 | Weight 700. |
| Dark | `title` | Rest | `theme.text.color` = `colors.gray.30` (`#DCDCDC`) | same as text | None | none | None | N/A | 1 | Weight 700, larger text size. |
| Light | nested link underline | Rest | Inherits parent text color | same as text | `theme.text.linkUnderlineColor` = `colors.gray.80` (`#444444`) | none | None | N/A | 1 | Underline is an absolutely positioned block `2px` tall placed `-2px` below the anchor text. |
| Dark | nested link underline | Rest | Inherits parent text color | same as text | `theme.text.linkUnderlineColor` = `colors.gray.30` (`#DCDCDC`) | none | None | N/A | 1 | Same structure as light theme. |

## Structure / Anatomy

| Part              | Source of truth                 | Visual role                                             | Relevant styling                                                    | Export note                                                                     |
| ----------------- | ------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| root text element | `NvText.vue` + `text.styled.ts` | Wrapper that carries semantic tag and typography styles | Base color, font family, font size, line height, letter spacing     | Figma base component should expose `Type`, `Theme`, and optional `Align`.       |
| inline mode       | `text.styled.ts`                | Keeps text inline when rendered as `span`               | `display: inline-flex` only when `as === 'span'`                    | Represent as an optional boolean or note; it does not change typography tokens. |
| anchor underline  | `text.styled.ts`                | Decorative underline block for descendant links         | `::before`, absolute positioning, 2px height, theme underline color | Model as a nested text style / annotation rather than a separate component.     |

## Token Mapping

| Concern                           | Token                           | Resolved value                                                                                                                                                                                             | Where used                                 |
| --------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| base font family                  | `tokens.fontFamily.sans`        | `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` | `defaultTextStyle`                         |
| body / label / subtitle base size | `tokens.fontSize.2`             | 14px / 1.4 / 0.32px                                                                                                                                                                                        | `defaultTextStyle`, `subtitle`             |
| caption and body-small size       | `tokens.fontSize.1`             | 12px / 1.4 / 0.32px                                                                                                                                                                                        | `caption`, `body-small`                    |
| title size                        | `tokens.fontSize.4`             | 18px / 1.4 / 0.32px                                                                                                                                                                                        | `title`                                    |
| link underline offset / thickness | `tokens.spacing.1`              | 2px                                                                                                                                                                                                        | Anchor `::before` bottom offset and height |
| light text color                  | `theme.text.color`              | `colors.gray.80` (`#444444`)                                                                                                                                                                               | All non-caption text in light theme        |
| dark text color                   | `theme.text.color`              | `colors.gray.30` (`#DCDCDC`)                                                                                                                                                                               | All non-caption text in dark theme         |
| light caption color               | `theme.text.captionColor`       | `colors.gray.60` (`#818181`)                                                                                                                                                                               | `caption` in light theme                   |
| dark caption color                | `theme.text.captionColor`       | `colors.gray.40` (`#BEBEBE`)                                                                                                                                                                               | `caption` in dark theme                    |
| light link underline color        | `theme.text.linkUnderlineColor` | `colors.gray.80` (`#444444`)                                                                                                                                                                               | Nested anchor underline in light theme     |
| dark link underline color         | `theme.text.linkUnderlineColor` | `colors.gray.30` (`#DCDCDC`)                                                                                                                                                                               | Nested anchor underline in dark theme      |

## Recommended Figma Mapping

| Figma property | Type                | Suggested values                                    | Derived from                         |
| -------------- | ------------------- | --------------------------------------------------- | ------------------------------------ |
| `Type`         | Variant             | `caption, label, body-small, body, subtitle, title` | `type` prop                          |
| `Theme`        | Variant             | `light, dark`                                       | Theme text slots in `text.styled.ts` |
| `Align`        | Variant or property | `default, left, center, right, justify`             | `align` prop                         |
| `Inline`       | Boolean             | `true, false`                                       | `as === 'span'` special case         |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                     | Status      | Notes                                                                              |
| ------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `size` prop behavior     | Ambiguous   | Prop exists and is exposed in Storybook, but `text.styled.ts` never reads it.      |
| Semantic tag matrix      | Not found   | Any string is accepted for `as`; no constrained list is documented in this folder. |
| Interactive states       | Unsupported | No hover, focus, active, disabled, or selected text-state styles are defined here. |
| Link hover/focus styling | Not found   | Only the static underline block is defined for descendant anchors.                 |
