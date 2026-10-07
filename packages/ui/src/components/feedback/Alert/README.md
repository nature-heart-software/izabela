# NvAlert Design Notes

Purpose: feedback message surface with four semantic types and size-based padding/min-height. Preserve the current themes: success, warning and error are visually identical within each theme; info is inverted. There is no icon, dismiss, action or title region and no built-in alert role/live-region declaration.

## Source Files Used

`NvAlert.vue:1–14`, `alert.shared.ts:4–22`, `alert.styled.ts:13–67`, `alert.stories.ts`; `packages/ui/src/utils/css-in-js.ts:34–85`; `packages/ui/src/components/typography/Text/{NvText.vue,text.shared.ts,text.styled.ts}`; `packages/ui/src/themes/{light,dark}.ts` (alert and text maps); `packages/design-tokens/src/main.ts`; global reset in `packages/ui/src/styles/main.scss` and `packages/ui/tailwind.config.cjs`. Pinned `vue3-styled-components@1.2.1` [registry source](https://registry.npmjs.org/vue3-styled-components/-/vue3-styled-components-1.2.1.tgz), `package/src/models/StyledComponent.js:21–64`, resolves polymorphic `as` rendering.

## Component Axes

| Property     | Kind / supported values                    | Default           | Effect                                                                                                 |
| ------------ | ------------------------------------------ | ----------------- | ------------------------------------------------------------------------------------------------------ |
| `type`       | String enum: success, warning, info, error | info              | Theme fill/foreground                                                                                  |
| `size`       | String enum: xs, sm, md, lg                | md                | Padding/min-height, **not final radius or font size**                                                  |
| `as`         | String tag                                 | div               | Pinned styled renderer changes root tag; local surface rules remain, native semantics/reset can differ |
| Default slot | Arbitrary content                          | Empty             | Always inside one default-body NvText wrapper; no named icon/action/dismiss slot                       |
| Theme        | Injected context                           | Consumer supplied | Light/dark values below; Storybook's dark provider is not a runtime prop default                       |

## Size Specification

All rem pixel equivalents below assume a 16px document root; custom root font-size scales these values. Root is a block div by default, not a flex row; no alignment/gap rule, fixed height/width, min-width or max dimensions are defined.

| Size | Padding (all four sides)   | Min-height declaration      | Final radius  | Body text                                                |
| ---- | -------------------------- | --------------------------- | ------------- | -------------------------------------------------------- |
| xs   | `spacing.2` → .25rem / 4px | `spacing.5` → 1rem / 16px   | .375rem / 6px | .875rem / 14px; line-height 1.4; tracking .02rem / .32px |
| sm   | `spacing.3` → .5rem / 8px  | `spacing.6` → 1.5rem / 24px | .375rem / 6px | Same                                                     |
| md   | `spacing.5` → 1rem / 16px  | `spacing.7` → 2rem / 32px   | .375rem / 6px | Same                                                     |
| lg   | `spacing.5` → 1rem / 16px  | `spacing.8` → 2.5rem / 40px | .375rem / 6px | Same                                                     |

**Radius precedence is resolved, not ambiguous:** `styleBySize()` first calls `borderRadiusStyleBySize(size)` (xs 4px, sm 6px, md/lg 8px), then `StAlert` emits `borderRadiusStyleBySize('sm')` last. The final radius is `borderRadius.sm` = **6px for every size**. The misleading `horizontalPadding` local name actually receives `paddingStyleBySize`, which sets all four sides.

Min-height is a minimum declaration, not a total height guarantee. With the package Tailwind preflight, border-box sizing applies; content wrapping and padding may require a taller box. No local margin, border, shadow, clipping, filter, focus ring, transition or opacity change is defined; unmodified default div has no border/effects and opacity 1, overflow visible. Rounded background does not clip arbitrary descendants.

## Variant And State Styles / Token Mapping

| Theme | Type    | Root fill token → resolved value                                                               | Foreground token → resolved value                    | State |
| ----- | ------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- | ----- |
| Light | info    | `theme.alert.info.backgroundColor` → `colors.black` #0E0E2C                                    | `theme.alert.info.color` → `colors.white` #ffffff    | rest  |
| Light | success | `theme.alert.success.backgroundColor` → light backgroundColor → #ffffff                        | `theme.alert.success.color` → `colors.black` #0E0E2C | rest  |
| Light | warning | `theme.alert.warning.backgroundColor` → light backgroundColor → #ffffff                        | `theme.alert.warning.color` → `colors.black` #0E0E2C | rest  |
| Light | error   | `theme.alert.error.backgroundColor` → light backgroundColor → #ffffff                          | `theme.alert.error.color` → `colors.black` #0E0E2C   | rest  |
| Dark  | info    | `theme.alert.info.backgroundColor` → `colors.white` #ffffff                                    | `theme.alert.info.color` → `colors.black` #0E0E2C    | rest  |
| Dark  | success | `theme.alert.success.backgroundColor` → dark backgroundColor → `darken(.0675)(gray.80)` → #333 | `theme.alert.success.color` → `colors.white` #ffffff | rest  |
| Dark  | warning | `theme.alert.warning.backgroundColor` → same dark backgroundColor → #333                       | `theme.alert.warning.color` → `colors.white` #ffffff | rest  |
| Dark  | error   | `theme.alert.error.backgroundColor` → same dark backgroundColor → #333                         | `theme.alert.error.color` → `colors.white` #ffffff   | rest  |

All states above have the same 6px radius and no stroke/shadow/blur. No hover, focus, active, selected, disabled, loading, open or dismiss skin is defined. Child interactions and native tag behavior remain consumer context, not Alert variants. Do not add semantic green/yellow/red fills not present in the source.

## Typography And Inherited Values

Nested NvText uses its defaults (`as=div`, `type=body`, `size=2`, `align=''`). Its explicit font-size uses `fontSize.2` regardless of the Text `size` prop (that prop is not read by Text styling). `fontSizeStyle` resolves .875rem, unitless line-height 1.4, .02rem letter-spacing. Full family: `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"` (`fontFamily.sans`).

NvText normally sets light text #444444/dark text #DCDCDC; **Alert's inline `color: inherit` overrides that declaration**, so actual default message color is the resolved Alert foreground in the table. This is not an unresolved inherited value. Font weight and text alignment are not declared for body Text or Alert: parent/native context supplies them; absent overrides, CSS defaults normal weight, start alignment, no text-transform/decoration apply. A custom child component can override typography/foreground; plain text follows this wrapper. No icon color or size is specified because there is no icon layer.

For a consumer-provided anchor inside the default slot, NvText styles `a` position relative and `::before` absolute left/right 0, bottom −.125rem (−2px), height .125rem (2px), content empty, fill `theme.text.linkUnderlineColor`: light #444444 (`gray.80`), dark #DCDCDC (`gray.30`). **The underline uses the Text theme, not the Alert foreground**. Shared `main.scss` sets anchors display inline-flex. Link text follows its own/ancestor CSS; no Alert link-hover/focus styling is defined. These rules apply only when such a descendant exists, not an invented link slot.

## Structure / Anatomy

| Part           | Source / relevant rules                                                    | Export note                                                                             |
| -------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Root StAlert   | Default div or `as`; padding, min-height, type fill/color, final sm radius | Single content-sized surface frame; no forced horizontal Auto Layout/vertical centering |
| Default NvText | One nested div, body typography, inline color inherit                      | Message text layer; all sizes use same text style                                       |
| Default slot   | Freeform child content inside Text                                         | No predefined icon/helper/action subcomponents; nested content may bring its own layout |

## Recommended Figma Mapping / Figma Build Notes

Expose Theme (light/dark), Type (info/success/warning/error), Size (xs/sm/md/lg), and replaceable Content. Keep semantic types even though three share identical colors. Apply fills/padding/min-height/radius to root and body typography to nested message. Radius stays 6px across sizes; no state variants beyond rest. Keep variable-height copy and do not model min-height as fixed total height. Leave overflow unclipped unless consumer context requests it.

## Gaps / Assumptions

- Author intent behind identical semantic colors and overwritten size radii is not documented; their actual values are fully resolved above and must be preserved.
- No browser-computed geometry or arbitrary slot contents are claimed. Parent weight/alignment, chosen native tag, root font-size and consumer overrides are contextual.
- No accessibility announcement, dismissal, action, icon, focus management or animation behavior is implemented here; adding any would require application changes, not doc reinterpretation.
