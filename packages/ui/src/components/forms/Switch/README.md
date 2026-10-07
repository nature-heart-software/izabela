# NvSwitch

Compact controlled Boolean toggle with track, moving thumb and border overlay. Checked state and hover/focus styling are independent. Current default span has click toggling, not a complete native/ARIA switch interaction contract.

## Source Files Used

- `NvSwitch.vue:1–27`: focusable root, label/hidden input, UUID and both update paths.
- `switch.shared.ts:3–14`: complete props/defaults.
- `switch.styled.ts:9–70`: track/thumb/overlay geometry, hover/focus, Boolean branch.
- `switch.stories.ts:7–27`: Boolean story model, not extra API.
- `packages/ui/src/themes/light.ts:138–150`, `packages/ui/src/themes/dark.ts:139–151`: theme.switch.
- `packages/design-tokens/src/main.ts:31–104`: colors, spacing, border/radius and transition.

## Component Axes

| Property / content        | Values                  | Default   | Current behavior                                                                                                        |
| ------------------------- | ----------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------- |
| `modelValue`              | Boolean                 | false     | Controls thumb fill and left offset; root click emits `update:modelValue(!props.modelValue)`; parent must update model. |
| `as`                      | string tag              | span      | Polymorphic styled root; changing tag does not establish alternate semantics/accessibility support.                     |
| Root attributes/listeners | undeclared native attrs | delegated | Fall through to styled root, not explicitly to hidden checkbox.                                                         |

No slots/exposed refs, size, variant, loading, disabled or readonly props/visual branches. An undeclared disabled/readonly attribute on the default span does not prevent the click handler; there is no guard in toggleValue. No selected API separate from the Boolean model. Story `value` initializes local ref; it is not a component prop.

## Size Specification

Pixel equivalents of `rem(...)` below assume a 16px root font size, not a fixed application root. Source lengths remain rem-based; numeric SVG width/height are separately described. Tables describe repository-authored declarations, not a browser-computed snapshot. No local opacity reduction is authored (normal opacity 1); external CSS may override it.

| Part / geometry              | Token / declaration          | Resolved value                                               |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------ |
| Track fixed width × height   | spacing[8] × spacing[6], rem | **2.5rem × 1.5rem / 40px × 24px**, not a min-width           |
| Track padding, all sides     | spacing[2], rem              | 0.25rem / 4px                                                |
| Track radius                 | borderRadius.sm, rem         | 0.375rem / 6px                                               |
| Thumb width × height         | spacing[5], rem              | 1rem × 1rem / 16px × 16px                                    |
| Thumb radius                 | borderRadius.xs, rem         | 0.25rem / 4px                                                |
| Thumb left (relative offset) | 0; checked rem(spacing[5])   | 0 off / 1rem (= 16px) on; **left**, not transform            |
| Border overlay               | borderWidth.DEFAULT, rem     | 0.0625rem / 1px solid; overlay width/height 100%, top/left 0 |
| Root focus shadow            | borderWidth.lg, rem          | 0 0 0 0.25rem (= 4px spread), no blur or offset              |

Root is relative inline-flex, pointer cursor, outline 0, with themed background. `::before` thumb is relative inline-flex with content ''; `::after` stroke is absolute, matching track radius, pointer-events none. Root/thumb/overlay all transition `all .3s` (300ms). No local flex alignment/justification/gap, typography, icon, opacity reduction, max/min dimension or overflow/clipping rule. Shared border-box reset is required for a 40px × 24px outer track with 4px padding; local source does not assign box-sizing, so standalone/reset-free rendering is not guaranteed. Thumb is an in-flow item shifted by relative left offset, not an absolute-positioned layer.

## Variant And State Style Tables

Complete checked/unchecked × light/dark × rest/hover/focus matrix. Hover/focus changes overlay stroke; focus adds root ring. Checked only changes thumb fill and left offset. No separate active/pressed style. Simultaneous hover+focus uses focus stroke/ring, with checked value unchanged.

| Theme | Checked | Interaction | Track fill | Thumb fill / left       | Overlay border                  | Root shadow             |
| ----- | ------- | ----------- | ---------- | ----------------------- | ------------------------------- | ----------------------- |
| light | false   | rest        | `#ffffff`  | `#EBEBEB` / 0           | 0.0625rem / 1px solid `#EBEBEB` | `none locally assigned` |
| light | false   | hover       | `#ffffff`  | `#EBEBEB` / 0           | 0.0625rem / 1px solid `#DCDCDC` | `none locally assigned` |
| light | false   | focus       | `#ffffff`  | `#EBEBEB` / 0           | 0.0625rem / 1px solid `#DCDCDC` | `0 0 0 0.25rem #F9F9FC` |
| light | true    | rest        | `#ffffff`  | `#0E0E2C` / 1rem (16px) | 0.0625rem / 1px solid `#EBEBEB` | `none locally assigned` |
| light | true    | hover       | `#ffffff`  | `#0E0E2C` / 1rem (16px) | 0.0625rem / 1px solid `#DCDCDC` | `none locally assigned` |
| light | true    | focus       | `#ffffff`  | `#0E0E2C` / 1rem (16px) | 0.0625rem / 1px solid `#DCDCDC` | `0 0 0 0.25rem #F9F9FC` |
| dark  | false   | rest        | `#333`     | `#626262` / 0           | 0.0625rem / 1px solid `#444444` | `none locally assigned` |
| dark  | false   | hover       | `#333`     | `#626262` / 0           | 0.0625rem / 1px solid `#626262` | `none locally assigned` |
| dark  | false   | focus       | `#333`     | `#626262` / 0           | 0.0625rem / 1px solid `#626262` | `0 0 0 0.25rem #444444` |
| dark  | true    | rest        | `#333`     | `#acacac` / 1rem (16px) | 0.0625rem / 1px solid `#444444` | `none locally assigned` |
| dark  | true    | hover       | `#333`     | `#acacac` / 1rem (16px) | 0.0625rem / 1px solid `#626262` | `none locally assigned` |
| dark  | true    | focus       | `#333`     | `#acacac` / 1rem (16px) | 0.0625rem / 1px solid `#626262` | `0 0 0 0.25rem #444444` |

Light hover/focus stroke is gray.30 **#DCDCDC**, not gray.40 #BEBEBE. Dark track resolves to #333 (= #333333), checked thumb to #acacac. Root ring is independent of checked state and belongs on the root, not on the thumb. These are authored source states, not a live-browser rendering guarantee.

## Structure / Anatomy

| Part                    | Source                                   | Reconstruction / behavior                                                                                                                                                        |
| ----------------------- | ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root track              | StSwitch, `NvSwitch.vue:2`               | Default span with tabindex=0, click toggle and root focus ring.                                                                                                                  |
| Thumb                   | `switch.styled.ts:21–31,62–69`, ::before | 16px, offset 0/16px, unchecked/checked themed fill.                                                                                                                              |
| Border overlay          | `switch.styled.ts:33–60`, ::after        | Full-size absolute stroke, pointer-events none. Hover/focus border-color changes affect this overlay only; focus also adds the root track box-shadow (`switch.styled.ts:47–60`). |
| Label / hidden checkbox | `NvSwitch.vue:3–11,23`                   | UUID links label for to hidden input id. No visible label text or child slot. Checkbox has `hidden` and type checkbox, **value-bound**, not checked-bound.                       |

## Events And Current Interaction Quirks

- Declared event is `update:modelValue`. Root click emits Boolean negation; there is no internal uncontrolled state.
- Hidden checkbox change emits **`$event.target.value` (a string)**, not `$event.target.checked` (Boolean). This is a different update path, not an ambiguous intended payload; source is preserved.
- Default root is focusable with tabindex=0, but there are **no Space/Enter key handlers, role=switch or aria-checked**. Focus ring does not imply keyboard toggling or accessible switch semantics. Hidden checkbox is not a focusable visible native control and its checked state is not model-bound.
- No disabled/readonly guards, validation or loading behavior. Root native passthrough does not automatically bind attributes to the hidden input; UUID association is not proof of normal checkbox form submission semantics.

## Token Mapping

| Concern                              | Token / theme                                              | Resolved value / context                                        |
| ------------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------------- |
| Track / padding / thumb and movement | spacing[8/6/2/5] via rem                                   | 40×24px / 4px / 16px at 16px root                               |
| Track/thumb radii                    | borderRadius.sm/xs                                         | 6px / 4px at 16px root                                          |
| Stroke / ring                        | borderWidth.DEFAULT/lg                                     | 1px / 4px spread at 16px root                                   |
| Track and stroke                     | theme.switch.backgroundColor / borderColor / hover / focus | Full matrix above; hover/focus delegate to input colors         |
| Thumb                                | theme.switch.thumbColor / activeThumbColor                 | Checked fill derives from plain button background; dark #acacac |
| Transition                           | transition.DEFAULT                                         | `all .3s` on root, thumb and overlay                            |

## Recommended Figma Mapping

| Property    | Kind                | Values                                           |
| ----------- | ------------------- | ------------------------------------------------ |
| Checked     | independent Boolean | false / true, not an exclusive interaction state |
| Interaction | variant             | rest / hover / focus                             |
| Theme       | variant             | light / dark                                     |

## Figma Build Notes

- Main frame is fixed 40×24px under shared border-box context, with 4px padding. Keep 16px thumb and its 16px horizontal travel explicit.
- Keep track fill, in-flow thumb and independent border overlay separate. Root focus ring remains outside the track; no local overflow-hidden rule clips it.
- Do not export disabled, readonly, loading, keyboard-activation or ARIA semantics as implemented features.

## Gaps / Assumptions

- Browser/reset-dependent box sizing, root attributes on alternate as tags, native label-click paths and hidden input submission behavior are not browser-tested.
- Keyboard/ARIA gaps, value-versus-checked binding, string change payload and absent interaction guards are current implementation quirks, not source fixes.
- No visible text/slot/icon, alternate size or selected axis is authored. Actual computed overflow and descendant sizing may depend on consumer CSS.
