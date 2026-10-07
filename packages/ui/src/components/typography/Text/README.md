# NvText Design Spec

Theme-aware text wrapper with six type styles. Source: [NvText.vue](./NvText.vue), [props](./text.shared.ts), [styles](./text.styled.ts), [story](./text.stories.ts), [typography helper](../../../utils/css-in-js.ts).

## Component Axes

| Property | Values                                                        | Default             | Actual behavior                                                                                                                                 |
| -------- | ------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`   | `caption`, `label`, `body-small`, `body`, `subtitle`, `title` | `body`              | Complete typography matrix below.                                                                                                               |
| `size`   | Font token keys `1`–`16`                                      | `2`                 | Declared and shown in Storybook, but **unused by component styling**. Changing it does not select a font size; do not expose a Figma Size axis. |
| `as`     | HTML tag string                                               | `div`               | Host tag; exact `span` adds `display:inline-flex`. No semantic tag is automatically selected from `type`.                                       |
| `align`  | CSS `text-align` value                                        | Empty string `''`   | Truthy value emits `text-align`; empty string emits no declaration, so alignment follows cascade/inheritance. No runtime enumeration validator. |
| Content  | Unscoped default slot                                         | No fallback content | Consumer text/inline content, including links. No custom emits or exposed methods.                                                              |

## Complete Typography Matrix

All `rem()` values use Polished’s default 16px conversion base. Pixel equivalents below assume a 16px document root; a different root scales rem geometry, not literal px geometry. No fixed container size is implied.

All types set the same sans font-family stack and `letter-spacing:0.02rem` (0.32px at a 16px root). Line height is **unitless 1.4**, not 1.4rem. Computed line heights below assume the specified font size and a 16px root.

| Type             | Font token        | Emitted font size | At 16px root | Line height | Computed line box | Font weight                   | Color slot                |
| ---------------- | ----------------- | ----------------- | ------------ | ----------- | ----------------- | ----------------------------- | ------------------------- |
| `caption`        | `fontSize.1`      | `0.75rem`         | 12px         | 1.4         | 16.8px            | **Inherited**, no declaration | `theme.text.captionColor` |
| `label`          | Base `fontSize.2` | `0.875rem`        | 14px         | 1.4         | 19.6px            | **700**                       | `theme.text.color`        |
| `body-small`     | `fontSize.1`      | `0.75rem`         | 12px         | 1.4         | 16.8px            | **Inherited**, no declaration | `theme.text.color`        |
| `body` (default) | Base `fontSize.2` | `0.875rem`        | **14px**     | 1.4         | 19.6px            | **Inherited**, no declaration | `theme.text.color`        |
| `subtitle`       | `fontSize.2`      | `0.875rem`        | 14px         | 1.4         | 19.6px            | **700**                       | `theme.text.color`        |
| `title`          | `fontSize.4`      | `1.125rem`        | 18px         | 1.4         | 25.2px            | **700**                       | `theme.text.color`        |

`defaultTextStyle` sets color, font family, and typography from token 2, **not font weight**. Caption, body-small, and body do not impose regular/400: they follow the applicable cascade and inherited parent weight. For example, under an otherwise unoverridden 700 parent, body remains 700. Label, subtitle, and title explicitly assign 700. An `as` tag’s UA rules or consumer overrides can still affect cascade; no universally fixed inherited numeric weight is promised.

Font-family CSS: `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. Nunito is the first requested family, not a guarantee that the font is loaded in every consumer. All types share tracking and family; `size` has no effect on this matrix.

## Variant And State Styles / Token Mapping

| Concern                                                   | Light                        | Dark                         |
| --------------------------------------------------------- | ---------------------------- | ---------------------------- |
| Body/label/body-small/subtitle/title `theme.text.color`   | `colors.gray.80` → `#444444` | `colors.gray.30` → `#DCDCDC` |
| Caption `theme.text.captionColor`                         | `colors.gray.60` → `#818181` | `colors.gray.40` → `#BEBEBE` |
| Descendant link underline `theme.text.linkUnderlineColor` | `colors.gray.80` → `#444444` | `colors.gray.30` → `#DCDCDC` |

No component fill, border, radius, padding, fixed width/height, opacity, shadow, or icon color is assigned. Text wraps and sizes according to host, content, and consumer constraints. No hover, focus, active, disabled, selected, or link-state overrides are implemented here; absence of custom styling does not remove native link behavior or focus styling.

## Structure / Descendant Links

The styled root carries typography and the selected host tag. `as="span"` uses inline-flex, not ordinary inline text flow; no other tag gets this display override. Consumers own arbitrary slotted children, including their color/font overrides.

Each descendant `a` gets `position:relative`. Its `::before` has `content:''`, `position:absolute`, `left:0`, `right:0`, `bottom:-0.125rem`, `height:0.125rem`, and the link-underline theme color. Offset and thickness use `tokens.spacing.1 = 2`: −2px and 2px respectively at a 16px root. Geometry is measured from the anchor box, not from a guaranteed font baseline. It is a decorative block, not a border/text-decoration or a separate visual state. No clipping or pointer-event override is set on the pseudo-element.

Shared [main.scss](../../../styles/main.scss) additionally makes all anchors `display:inline-flex`; that rule is application/shared CSS context, not a local NvText declaration. Anchor color/weight can follow inheritance or other applicable styles; the NvText selector does not explicitly force them.

## Recommended Figma Mapping

Expose Type (all six), Theme, content, and a documented alignment control. Default Type is body/14px at a 16px root. For caption/body-small/body, annotate **inherited weight** and select the preview weight from its actual context instead of defining an intrinsic 400 variant. Keep `size` as an implementation caveat, not a working visual axis. Annotate exact span inline-flex behavior; it is not a generic boolean prop. Model links as nested content with the static underline geometry, without invented hover/focus or hidden-state variants.

## Context / Remaining Uncertainties

Typography tokens, all six weights, colors, and unused-size behavior are resolved. Actual inherited weight, font availability, host tag/reset rules, alignment, and child overrides depend on the embedding. Link focus/hover appearance outside this component is consumer/native CSS, not a missing local theme value.

## Supporting Sources

`text.shared.ts:5–31`; `text.styled.ts:10–57`; `css-in-js.ts:16–38`; [design tokens](../../../../../design-tokens/src/main.ts), lines 4–20,51–58,70–86; [light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts).
