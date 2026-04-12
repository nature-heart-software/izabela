# NvIcon Design Spec

- Purpose: render an icon from `@packages/icons` at a token-driven square size using `currentColor`.
- Source files used: `NvIcon.vue`, `icon.shared.ts`, `icon.styled.ts`, `icon.stories.ts`

## Component Axes

| Property | Kind              | Values                                   | Default        | Notes                                                                                                                                                                     |
| -------- | ----------------- | ---------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`   | enum-like string  | Icon names exported by `@packages/icons` | `times-square` | Runtime lookup accepts both `name` and `nv-${name}`. Storybook exposes the exported icon names without the `nv-` prefix.                                                  |
| `size`   | numeric token key | `1`-`16` in Storybook                    | `5`            | `NvIcon.vue` resolves this through `tokens.fontSize[size][0]`. `icon.shared.ts` types it as `keyof typeof tokens.spacing`, which is inconsistent with the runtime lookup. |
| `color`  | inherited style   | Unsupported as a prop                    | Not found      | SVG fill is hard-coded to `currentColor`, so color is driven by parent text color / CSS.                                                                                  |
| `state`  | visual state      | Rest only                                | Rest           | No hover, focus, active, disabled, or selected styling in this folder.                                                                                                    |

## Size Specification

| Size | Height | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography           | Icon size | Notes                     |
| ---- | ------ | --------- | --------- | --------- | --- | ------ | ------------ | -------------------- | --------- | ------------------------- |
| `1`  | 12px   | 12px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.1`  | 12px      | Square SVG viewport size. |
| `2`  | 14px   | 14px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.2`  | 14px      | Square SVG viewport size. |
| `3`  | 16px   | 16px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.3`  | 16px      | Square SVG viewport size. |
| `4`  | 18px   | 18px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.4`  | 18px      | Square SVG viewport size. |
| `5`  | 24px   | 24px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.5`  | 24px      | Prop default.             |
| `6`  | 28px   | 28px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.6`  | 28px      | Square SVG viewport size. |
| `7`  | 32px   | 32px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.7`  | 32px      | Square SVG viewport size. |
| `8`  | 36px   | 36px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.8`  | 36px      | Square SVG viewport size. |
| `9`  | 42px   | 42px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.9`  | 42px      | Square SVG viewport size. |
| `10` | 48px   | 48px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.10` | 48px      | Square SVG viewport size. |
| `11` | 54px   | 54px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.11` | 54px      | Square SVG viewport size. |
| `12` | 60px   | 60px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.12` | 60px      | Square SVG viewport size. |
| `13` | 68px   | 68px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.13` | 68px      | Square SVG viewport size. |
| `14` | 76px   | 76px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.14` | 76px      | Square SVG viewport size. |
| `15` | 84px   | 84px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.15` | 84px      | Square SVG viewport size. |
| `16` | 92px   | 92px      | N/A       | N/A       | N/A | N/A    | N/A          | `tokens.fontSize.16` | 92px      | Square SVG viewport size. |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| Light | Default | Rest | Inherited via `currentColor` | same as text | None | none | None | N/A | 1 | Component itself does not set color. |
| Dark | Default | Rest | Inherited via `currentColor` | same as text | None | none | None | N/A | 1 | Same as light theme. |

## Structure / Anatomy

| Part                   | Source of truth  | Visual role                                   | Relevant styling                                               | Export note                                                                         |
| ---------------------- | ---------------- | --------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| root dynamic component | `NvIcon.vue`     | Renders the resolved icon component           | `height` and `width` set to `sizeValue`; `fill="currentColor"` | Figma component should inherit color from context instead of baking per-icon fills. |
| icon asset lookup      | `NvIcon.vue`     | Maps prop name to one exported icon component | Matches `name` or `nv-${name}` against icon component names    | Keep icon asset names aligned with the exported package naming.                     |
| legacy styled wrapper  | `icon.styled.ts` | Historical square icon wrapper                | Defines inline-flex square sizing from `tokens.fontSize`       | Not used by `NvIcon.vue` at runtime.                                                |

## Token Mapping

| Concern         | Token                                    | Resolved value                                                                                                                 | Where used                                                                                |
| --------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| icon size scale | `tokens.fontSize.1`-`tokens.fontSize.16` | `12px`, `14px`, `16px`, `18px`, `24px`, `28px`, `32px`, `36px`, `42px`, `48px`, `54px`, `60px`, `68px`, `76px`, `84px`, `92px` | `sizeValue` in `NvIcon.vue`; width / height / font-size / line-height in `icon.styled.ts` |
| icon color      | Not found                                | Inherited from surrounding `color` CSS                                                                                         | SVG `fill` in `NvIcon.vue`                                                                |

## Recommended Figma Mapping

| Figma property | Type                 | Suggested values                                        | Derived from                                                                      |
| -------------- | -------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `Icon`         | Instance swap / enum | Exported icon names from `@packages/icons`              | `name` prop + runtime lookup                                                      |
| `Size`         | Variant              | `1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16` | `size` prop                                                                       |
| `Theme`        | Variant              | `light, dark`                                           | Color is inherited; include only if icon is previewed inside themed text contexts |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                        | Status      | Notes                                                                 |
| --------------------------- | ----------- | --------------------------------------------------------------------- |
| Prop typing for `size`      | Ambiguous   | Type points at `tokens.spacing`, but runtime reads `tokens.fontSize`. |
| Storybook default `name`    | Ambiguous   | Story default is `github`, prop default is `times-square`.            |
| Missing resolved asset list | Not found   | The full icon set lives in `@packages/icons`, outside this folder.    |
| Interactive states          | Unsupported | No state-specific styling is implemented in this folder.              |
