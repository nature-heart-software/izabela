# NvCenter Design Spec

- Purpose: center child content on both axes with either block-level or inline-level flex layout.
- Source files used: `NvCenter.vue`, `center.shared.ts`, `center.styled.ts`, `center.stories.ts`

## Component Axes

| Property     | Kind             | Values                  | Default   | Notes                                                |
| ------------ | ---------------- | ----------------------- | --------- | ---------------------------------------------------- |
| `inline`     | boolean          | `true`, `false`         | `false`   | Switches `display` between `inline-flex` and `flex`. |
| `as`         | element selector | Any HTML tag string     | `div`     | Changes rendered tag only.                           |
| content mode | slot             | Arbitrary child content | Not found | Single default slot.                                 |
| state        | visual state     | Rest only               | Rest      | No visual state styling in this folder.              |

## Size Specification

| Size    | Height                     | Min width                  | Padding X | Padding Y | Gap | Radius | Border width | Typography | Icon size | Notes                                                                                    |
| ------- | -------------------------- | -------------------------- | --------- | --------- | --- | ------ | ------------ | ---------- | --------- | ---------------------------------------------------------------------------------------- |
| Default | Content- or parent-defined | Content- or parent-defined | 0         | 0         | 0   | N/A    | 0            | N/A        | N/A       | Storybook sets a demo height of `200px`, but the component itself does not enforce size. |

## Variant And State Styles

| Theme | Variant | State | Text color | Icon color | Background / fill | Border / stroke | Shadow / effects | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------- | ----------------- | --------------- | ---------------- | ------ | ------- | ----- |
| Light | block | Rest | Inherited | same as text | None | none | None | N/A | 1 | `display: flex; align-items: center; justify-content: center`. |
| Light | inline | Rest | Inherited | same as text | None | none | None | N/A | 1 | `display: inline-flex; align-items: center; justify-content: center`. |
| Dark | block | Rest | Inherited | same as text | None | none | None | N/A | 1 | Same as light theme. |
| Dark | inline | Rest | Inherited | same as text | None | none | None | N/A | 1 | Same as light theme. |

## Structure / Anatomy

| Part                | Source of truth    | Visual role                                       | Relevant styling                                            | Export note                                                                  |
| ------------------- | ------------------ | ------------------------------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| root flex container | `center.styled.ts` | Centers child content horizontally and vertically | `display`, `align-items: center`, `justify-content: center` | Figma frame should use both-axis center constraints / auto layout alignment. |
| slotted content     | `NvCenter.vue`     | Arbitrary centered content                        | No styling applied inside the slot                          | Document this as a layout utility rather than a styled visual component.     |

## Token Mapping

| Concern       | Token     | Resolved value | Where used                                                                     |
| ------------- | --------- | -------------- | ------------------------------------------------------------------------------ |
| layout tokens | Not found | Unsupported    | No spacing, radius, color, or typography tokens are referenced in this folder. |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values | Derived from                                                       |
| -------------- | ------- | ---------------- | ------------------------------------------------------------------ |
| `Inline`       | Boolean | `true, false`    | `inline` prop                                                      |
| `Theme`        | Variant | `light, dark`    | Only for documentation consistency; visuals do not change by theme |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                    | Status      | Notes                                                         |
| ----------------------- | ----------- | ------------------------------------------------------------- |
| Width / height defaults | Not found   | Layout depends entirely on parent container and slot content. |
| Gap between children    | Not found   | No child spacing rule is implemented.                         |
| Interactive states      | Unsupported | No hover, focus, active, or disabled handling.                |
