# NvRangeInput

Horizontal native range input with one repository-authored visual style. Custom track and thumb selectors are WebKit-only; value positioning and interaction are browser-controlled.

## Source Files Used

- `NvRangeInput.vue:1–16`: native value/type binding and numeric input event.
- `range-input.shared.ts:3–14`: complete props/defaults.
- `range-input.styled.ts:9–72`: root, track, thumb and distinct focus selectors.
- `range-input.stories.ts:7–25`: default model example; `value` is a story arg, not a component prop.
- `packages/ui/src/themes/light.ts:161–168`, `packages/ui/src/themes/dark.ts:162–169`: theme.rangeInput (derived from plain-button colors).
- `packages/design-tokens/src/main.ts:31–104`: colors, spacing, radii and border widths.

## Component Axes

| Property / content          | Values                         | Default   | Current behavior                                                                                                        |
| --------------------------- | ------------------------------ | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `modelValue`                | number                         | 0         | Bound as native value, controlled by parent; native input event emits `update:modelValue(Number($event.target.value))`. |
| `as`                        | string tag                     | input     | Styled polymorphic tag; range styling/semantics require an actual input of type range.                                  |
| Native attributes/listeners | min, max, step, disabled, etc. | delegated | Undeclared attributes fall through to styled/native root. Library does not assign bounds/step.                          |

Template authors `type="range"`; behavior under consumer type overrides/alternate `as` tags is not a supported alternative visual spec. No slots or exposed refs, size, variant, selected, readonly, loading or disabled props/visual branches. Native `disabled` can prevent interaction, without an authored disabled appearance. Native range does not support readonly semantics; an arbitrary readonly attribute is not a library read-only implementation. Standard native keyboard/value behavior is delegated, not separately implemented or browser-verified.

## Size Specification

Pixel equivalents of `rem(...)` below assume a 16px root font size, not a fixed application root. Source lengths remain rem-based; numeric SVG width/height are separately described. Tables describe repository-authored declarations, not a browser-computed snapshot. No local opacity reduction is authored (normal opacity 1); external CSS may override it.

| Part / rule             | CSS / token                             | Resolved geometry                                                                                                        |
| ----------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Root                    | literal width 15rem                     | 240px at 16px root; no authored height, min/max width, padding, margin or gap                                            |
| Track                   | spacing[2] via rem                      | 0.25rem / 4px tall; width managed by native control; no local border/radius                                              |
| Thumb                   | spacing[4] via rem for width and height | **0.75rem / 12px × 12px**, not 16px                                                                                      |
| Thumb top margin        | rem(-(spacing[4]/2) + spacing[2]/2)     | -0.25rem / **-4px**, centers 12px thumb on 4px rail                                                                      |
| Thumb radius            | borderRadius.DEFAULT via rem            | 0.5rem / 8px authored; CSS used radius is constrained by the 12px box, not a promise of a physically separate 8px corner |
| Root-focus thumb border | borderWidth.DEFAULT via rem             | 0.0625rem / 1px solid; only when root :focus matches                                                                     |
| Thumb-focus shadow      | borderWidth.lg via rem                  | 0 0 0 0.25rem (= 4px spread), conditional on thumb:focus                                                                 |

Root: `appearance:none`, `-webkit-appearance:none`, transparent background, pointer cursor; root `:focus` suppresses outline. Thumb also resets both appearance properties. There is **no local transition declaration** (transition token is destructured but unused), no opacity change, progress segment, typography, icon, user-select or overflow rule. Native/reset/vendor CSS determines box-sizing and default borders/margins/padding where no rule exists.

## Variant And State Style Tables

Rest/hover/active set thumb **border-color**, not a border width/style; do not draw an invented rest stroke. Root-focus border and thumb-focus shadow are separate conditions. Thumb hover/active need native pseudo-element matching, not simply hover anywhere on the root.

| Theme | Target / state                 | Background                          | Border declaration              | Shadow                                           |
| ----- | ------------------------------ | ----------------------------------- | ------------------------------- | ------------------------------------------------ |
| light | WebKit track, all states       | `#EBEBEB`                           | none local                      | none local                                       |
| light | WebKit thumb :rest             | `#0E0E2C`                           | color only `#0E0E2C`            | none locally assigned by this state              |
| light | WebKit thumb :hover            | `#2B2B2C`                           | color only `#2B2B2C`            | none locally assigned by this state              |
| light | WebKit thumb :active           | `#626262`                           | color only `#626262`            | none locally assigned by this state              |
| light | **root :focus** → WebKit thumb | unchanged by focus (rest `#0E0E2C`) | 0.0625rem / 1px solid `#2B2B2C` | no root-focus shadow rule                        |
| light | **WebKit thumb :focus**        | unchanged by focus                  | unchanged by this selector      | `0 0 0 0.25rem #626262`; selector match unproven |
| dark  | WebKit track, all states       | `#444444`                           | none local                      | none local                                       |
| dark  | WebKit thumb :rest             | `#acacac`                           | color only `#acacac`            | none locally assigned by this state              |
| dark  | WebKit thumb :hover            | `#BEBEBE`                           | color only `#BEBEBE`            | none locally assigned by this state              |
| dark  | WebKit thumb :active           | `#9F9F9F`                           | color only `#9F9F9F`            | none locally assigned by this state              |
| dark  | **root :focus** → WebKit thumb | unchanged by focus (rest `#acacac`) | 0.0625rem / 1px solid `#EBEBEB` | no root-focus shadow rule                        |
| dark  | **WebKit thumb :focus**        | unchanged by focus                  | unchanged by this selector      | `0 0 0 0.25rem #DCDCDC`; selector match unproven |

Hover and active selectors have equal specificity; active follows hover and wins for background/border-color when both match. Focus does not change fill, so hover/active fill can coexist with focus. Root-focus thumb border selector is distinct; under ordinary generated-selector specificity/source order its later border shorthand supplies the focus stroke even during thumb hover/active. No general selected state or progress fill is authored.

**Focus limitation:** source nests `&:focus` inside `&::-webkit-slider-thumb` (`range-input.styled.ts:63–66`), whereas border is `&:focus::-webkit-slider-thumb` (`:69–71`). Native keyboard focus is on the input; this does not prove the thumb pseudo-element matches `:focus`, nor that its shadow becomes visible. Root outline is suppressed, so do not present the 4px ring as a verified keyboard-focus treatment. Browser support for thumb hover/active/focus and generated pseudo-element selectors is unproven. Preserve this risk rather than changing source or rewriting the shadow onto root focus.

## Structure / Anatomy

| Part              | Source                            | Reconstruction                                                                                                              |
| ----------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Native input root | StRangeInput                      | Transparent 15rem-wide frame; native control controls thumb translation and current value. No authored label/helper/output. |
| Rail              | `::-webkit-slider-runnable-track` | 4px height and fixed themed fill, no separate value-filled segment.                                                         |
| Handle            | `::-webkit-slider-thumb`          | 12px square, authored 8px radius and -4px top margin; state fill and conditional focus border/shadow belong here.           |

## Token Mapping

| Concern                      | Source token             | Resolution / context                                                          |
| ---------------------------- | ------------------------ | ----------------------------------------------------------------------------- |
| Rail / thumb / centering     | spacing[2] / spacing[4]  | 4px / 12px; -(12/2)+(4/2) = -4px at 16px root                                 |
| Radius                       | borderRadius.DEFAULT     | 0.5rem / 8px authored                                                         |
| Focus border / shadow spread | borderWidth.DEFAULT / lg | 0.0625rem / 0.25rem (= 1px / 4px)                                             |
| Colors                       | theme.rangeInput         | Complete matrix above; dark thumb is polished lighten(0.05,#9F9F9F) = #acacac |
| Width                        | literal 15rem            | 240px at 16px root, not a spacing-token width                                 |

## Recommended Figma Mapping

| Property           | Kind                   | Values                                             |
| ------------------ | ---------------------- | -------------------------------------------------- |
| Theme              | variant                | light / dark                                       |
| Thumb interaction  | variant                | rest / hover / active                              |
| Root Focus         | independent boolean    | 1px thumb border; combine with interaction         |
| Thumb Focus shadow | conditional annotation | Do not imply verified native keyboard ring         |
| Value              | positional content     | Native controlled position; no progress-fill style |

## Figma Build Notes

- Use one fixed-width transparent root and a 4px rail; draw a 12px thumb, not a 16px handle. Keep rem scaling assumption explicit.
- Apply colors and effects to the actual rail/thumb layers; no authored transition, label, tick marks or progress fill.
- Separate root-focus stroke from unproven thumb-focus shadow. Do not export the latter as guaranteed accessibility behavior.

## Gaps / Assumptions

- Firefox/non-WebKit custom styling is absent. Removing native appearance does not supply missing cross-browser track/thumb rules.
- Browser/native bounds, default step, hit target, value rounding/clamping, thumb placement and outer height are not locally specified or verified.
- Disabled is native passthrough only; readonly, loading and selected are unsupported local axes. No automatic form label/ARIA attributes are authored.
