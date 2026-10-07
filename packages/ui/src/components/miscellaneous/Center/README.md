# NvCenter Design Spec

Purpose: center child content on both axes with block-level or inline-level flex layout. This is a layout utility, not a theme-colored surface.

## Source Files Used

`NvCenter.vue:1–12`, `center.shared.ts:3–12`, `center.styled.ts:5–9`, `center.stories.ts:24–60`; global context in `packages/ui/src/styles/main.scss`, `packages/ui/tailwind.config.cjs`, `packages/design-tokens/src/main.ts`. Pinned `vue3-styled-components@1.2.1` [registry source](https://registry.npmjs.org/vue3-styled-components/-/vue3-styled-components-1.2.1.tgz), `package/src/models/StyledComponent.js:21–64`, proves string-target rendering uses `props.as || tagOrComponent`. Global reset context comes from pinned Tailwind CSS 3.2.4 `src/css/preflight.css`.

## Component Axes

| Property     | Kind / values     | Default | Meaning                                                                                                             |
| ------------ | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------- |
| `inline`     | Boolean           | false   | false → display flex (block outer display); true → inline-flex (inline outer display)                               |
| `as`         | String tag        | `div`   | Styled renderer changes native tag; the flex rules are unchanged, but native semantics/other reset rules may differ |
| Default slot | Arbitrary content | Empty   | No child visual styles or typography are assigned                                                                   |

No size, spacing, theme, state, disabled, or animation prop is declared. There is no light/dark-specific rule.

## Size Specification / Layout

| Concern               | Source-defined contract                                                                                                                                                                                                                          |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Both modes            | `align-items: center; justify-content: center`                                                                                                                                                                                                   |
| Direction / wrapping  | No declarations; CSS initial flex-direction row, flex-wrap nowrap. Multiple child flex items share a row; they are not individually absolute-centered                                                                                            |
| Width / height        | No explicit width/height/min/max sizes. Default div flex mode occupies available inline space in normal block layout; inline-flex mode is content-sized subject to normal inline formatting. Available height is content/parent/consumer context |
| Spacing               | No padding, margin or gap declarations. Default div has no native padding/margin; gap normal produces no flex gap. Child margins, text whitespace and consumer styles may add spacing                                                            |
| Shape / stroke / fill | No radius/border/background declaration. Unmodified default div has transparent fill, no border, radius 0; this is not a reset of consumer styles                                                                                                |
| Overflow / effects    | No clipping, shadow, outline, filter, opacity or transition declaration; standard initial overflow visible, shadow/filter none, opacity 1 absent overrides                                                                                       |
| Inline alignment      | No vertical-align declaration; inline-flex participates in baseline layout. Centering its items is not a guarantee that the utility aligns to the text middle of its surrounding line                                                            |

Storybook's `height: 200px` and `bg-gray-10` (#F9F9FC) are demo styling, not Center defaults. Its SVG's 16×16px dimensions and black 2px stroke, and the `&nbsp;` before the text, belong to example slot content; Center supplies no icon size/color/gap.

## Typography / Contextual Values

Center sets no font-family, size, weight, line-height, letter-spacing, text-transform, decoration, color or text-align. It also supplies no icon styling: only an icon explicitly using currentColor would follow the inherited text color.

With package global Tailwind preflight and `tailwind.config.cjs`, default font-family is `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`, and root line-height is 1.5. Preflight does not establish a theme foreground or explicit body font-size. Center receives the nearest ancestor's font-size, color, weight, line-height, alignment and letter-spacing; without further styles, CSS defaults are normal weight/spacing, no transform/decoration and start alignment. Document-root text size/color remain host/browser settings, not a component guarantee. A styled Text child supplies its own typography; raw slot text follows Center's context. In an AccessBlocker inside Card, Card's explicit `font-size: 0` can propagate through Center, while fallback Alert/NvText restore their own body text size.

## Structure / Anatomy

| Part            | Rule / source                                                                             | Export note                                                  |
| --------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Root `StCenter` | One styled div (or `as` tag), display flex/inline-flex with centered main/cross alignment | One horizontal no-wrap Auto Layout frame, both-axis centered |
| Default slot    | Direct children of root, no extra container                                               | Freeform child content; preserve its own geometry/styles     |

## Variant And State Styles / Token Mapping

| Mode                   | State | Local styling                        |
| ---------------------- | ----- | ------------------------------------ |
| Block (`inline=false`) | Rest  | display flex; centered items/content |
| Inline (`inline=true`) | Rest  | display inline-flex; same centering  |

No component token imports or theme reads; no local hover/focus/active/selected/disabled/loading state or effects. Interactive child components retain their own states; Center does not modify them. Native `as` elements or consumer classes may have independent focus/hover styles; do not label those Center variants.

## Recommended Figma Mapping / Figma Build Notes

Expose `Inline` Boolean and replaceable `Content`. The two modes differ in outer layout sizing, not colors. Do **not** add a Theme variant: there is no theme-dependent visual change. Use parent-defined bounds when demonstrating vertical centering; do not bake the story's 200px height/background or SVG into the utility. No clipping or fixed content size is implied.

## Gaps / Assumptions

Actual bounds, browser/root text defaults, inherited parent typography/colors, chosen tag's semantics, consumer classes and arbitrary slot contents are contextual. No computed-browser values or fixed icon appearance are claimed. Center has no API for a gap or child growth; CSS flex defaults and child styles determine shrink/growth.
