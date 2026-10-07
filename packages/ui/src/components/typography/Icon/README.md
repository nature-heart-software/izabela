# NvIcon Design Spec

Purpose: render an exported icon component with square width/height derived from **`tokens.fontSize`**, inheriting foreground via `currentColor`. Source baseline: `3390fc0378a7f6e055d4cd4804d765599b4adeb6`.

## Source Evidence

- [NvIcon.vue](./NvIcon.vue), lines 1–21: dynamic component, width/height, currentColor and name lookup.
- [icon.shared.ts](./icon.shared.ts), lines 4–12: complete declared props and type mismatch.
- [icon.styled.ts](./icon.styled.ts), lines 9–15: legacy **unused** wrapper; [story](./icon.stories.ts), lines 11–20 and 31–33: controls and inconsistent template/default.
- [Design tokens](../../../../../design-tokens/src/main.ts), lines 70–86: font-size scale; [icons package entry](../../../../../icons/src/main.ts), [icon assets / exports](../../../../../icons/src/components/icons), and [default asset](../../../../../icons/src/components/icons/NvTimesSquare.vue), lines 1–10.

## Component Axes

| Property   | Kind                          | Values                                                        | Default                  | Notes                                                                                                                                  |
| ---------- | ----------------------------- | ------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `name`     | Icon-name lookup              | Exported component `name` or corresponding name without `nv-` | **`times-square`**       | Finds first export where `[props.name, 'nv-' + props.name]` includes component name. No name normalization or fallback is implemented. |
| `size`     | Numeric token key             | **Font-size keys 1–16**, complete table below                 | **5 → 24px**             | Runtime `tokens.fontSize[props.size][0]`; NOT the spacing scale.                                                                       |
| Foreground | CSS context, not a color prop | Parent/consumer `color`                                       | No component color value | Root asset receives `fill="currentColor"`.                                                                                             |

No slots are invoked, no component emit or exposed API is declared, and there are no local state, variant, disabled, loading, selected, radius or stroke props. Dynamic asset attrs/events supplied by a consumer are not named NvIcon props or a fixed interactivity contract. `name` definition literally contains `String` rather than `type: String`; do not imply a correctly enforced runtime enum/string validator.

## Size Specification

| Size key      | Width attribute | Height attribute | Runtime token    |
| ------------- | --------------- | ---------------- | ---------------- |
| `1`           | 12px            | 12px             | `fontSize.1[0]`  |
| `2`           | 14px            | 14px             | `fontSize.2[0]`  |
| `3`           | 16px            | 16px             | `fontSize.3[0]`  |
| `4`           | 18px            | 18px             | `fontSize.4[0]`  |
| `5` (default) | 24px            | 24px             | `fontSize.5[0]`  |
| `6`           | 28px            | 28px             | `fontSize.6[0]`  |
| `7`           | 32px            | 32px             | `fontSize.7[0]`  |
| `8`           | 36px            | 36px             | `fontSize.8[0]`  |
| `9`           | 42px            | 42px             | `fontSize.9[0]`  |
| `10`          | 48px            | 48px             | `fontSize.10[0]` |
| `11`          | 54px            | 54px             | `fontSize.11[0]` |
| `12`          | 60px            | 60px             | `fontSize.12[0]` |
| `13`          | 68px            | 68px             | `fontSize.13[0]` |
| `14`          | 76px            | 76px             | `fontSize.14[0]` |
| `15`          | 84px            | 84px             | `fontSize.15[0]` |
| `16`          | 92px            | 92px             | `fontSize.16[0]` |

Widths and heights are numeric SVG attributes using the raw font-size number, not rem-based layout CSS. No min-width or min-height is declared: square width/height attributes are **not** CSS minimum sizes. No component padding, gap, background, stroke, corner radius, outline, shadow, blur or explicit opacity is set. SVG viewBox and paths belong to each asset and the viewport is not the glyph's actual painted bounding box. Default times-square asset has `viewBox="0 0 24 24"`; retain original asset paths when recreating it.

The runtime consumes only tuple `[0]`; it does **not** apply the fontSize tuple's line-height 1.4 or letter-spacing 0.32px, and does not apply text font family/weight. Assets may have their own geometry or paint attributes; `fill=currentColor` at the root is not proof that every exported asset path has identical stroke/fill construction.

## Variant And State Styles

| Context | State                                                  | Foreground / paint                                                    | Surface / effects                                | Notes                                                                       |
| ------- | ------------------------------------------------------ | --------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------- |
| Light   | Default                                                | SVG root `fill=currentColor`; actual color inherited/consumer-defined | No local surface, border, shadow or opacity rule | No theme import or fixed light color.                                       |
| Dark    | Default                                                | Same                                                                  | Same                                             | No intrinsic theme switch or dark-specific value.                           |
| Either  | Hover / focus / active / disabled / selected / loading | No local state-specific change                                        | None declared                                    | Consumer parent or icon asset can change appearance; not an NvIcon variant. |

Do not state opacity 1 as a forced property or call asset paths a component background. Icon has no locally imposed keyboard focusability, role, accessible label or button behavior; clickable/focusable affordances belong to consuming components and their attributes.

## Structure / Anatomy

| Part                   | Source                           | Role / export note                                                                                                                                                                 |
| ---------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dynamic root component | NvIcon template                  | Receives width=sizeValue, height=sizeValue, fill=currentColor; no additional wrapper frame.                                                                                        |
| Export lookup          | `Object.values(Icons).find(...)` | Resolves asset by component `name`, not export identifier or an arbitrary SVG path/string.                                                                                         |
| Asset                  | `@packages/icons`                | Owns viewBox, SVG paths and any asset-level painting; use exact package export for instance swap.                                                                                  |
| Legacy `StIcon`        | icon.styled.ts                   | Inline-flex `<i>` with rem width/height/font-size/line-height, **not imported or rendered by NvIcon.vue**. Never apply its inline-flex or line-height as current runtime geometry. |

## Interaction And Error Cases

- There is no local hover/focus/active/disabled/loading handler or transition; Icon is a visual asset, not a standalone action control.
- Invalid size keys are not guarded: the computed lookup accesses `[0]` on the selected fontSize entry. A key absent from the font-size record can fail; do not document arbitrary spacing keys as valid.
- Unknown names yield no match from `.find`; no local missing-icon fallback, warning label or placeholder shape is defined. Exact Vue handling of an unresolved dynamic component is not a browser-verified output claim here.
- Prefix lookup accepts actual `nv-*` component names or corresponding unprefixed names; no case-folding, trimming or alias inference is performed.

## Token Mapping

| Concern               | Token / source                              | Resolved value                                                   |
| --------------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| Square viewport       | `tokens.fontSize.1`–`.16`, tuple `[0]` only | 12, 14, 16, 18, 24, 28, 32, 36, 42, 48, 54, 60, 68, 76, 84, 92px |
| Default viewport      | `tokens.fontSize.5[0]`                      | 24px × 24px                                                      |
| Context foreground    | `currentColor`                              | No component-specific light/dark color token                     |
| Legacy wrapper sizing | Same font-size scale through `rem()`        | Unused code, not the dynamic SVG output                          |

## Recommended Figma Mapping

| Property   | Type                    | Values                         | Derived from                      |
| ---------- | ----------------------- | ------------------------------ | --------------------------------- |
| Icon       | Instance swap           | Package asset names            | Exported component names / lookup |
| Size       | Variant                 | 1–16, numeric dimensions above | Runtime font-size keys, default 5 |
| Foreground | Inherited/context style | Consumer color                 | currentColor                      |

Theme preview can demonstrate consumer colors but is not an intrinsic Icon axis. Do not add local hover/disabled variants, label slots, padding frames, minimum widths or focus rings.

## Figma Build Notes

- Keep a square viewport at the selected pixel dimensions and retain the exact SVG viewBox/path; preserve paint inset instead of stretching the painted glyph to fill the viewport.
- Use inherited foreground styles. Do not insert the unused `<i>` wrapper's rem text metrics into the asset frame.
- Maintain package asset names for instance swaps; use the package exports as the canonical catalog, not Storybook's default as an API default.

## Gaps / Assumptions

| Topic                         | Current evidence                                                                                                                                                                                                  |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Type annotation mismatch      | `size` is typed as `keyof typeof tokens.spacing`, but runtime and story use fontSize. Keys currently overlap 1–16; **values do not** (size 5 is 24px, not spacing.5's 16px). No type/runtime repair is made here. |
| Story default / template      | Story name control defaults to `github`, runtime prop defaults to `times-square`. Story template closes `</nv-text>` despite opening NvIcon; not evidence of a label slot or a different renderer.                |
| Asset variety                 | Full catalog and intrinsic paths are in linked package exports/assets; arbitrary name geometry or universal stroke behavior is not asserted.                                                                      |
| Accessibility / unknown names | No local labeling/fallback contract; consumer attributes and asset behavior require separate verification. No browser values were guessed.                                                                        |
