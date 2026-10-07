# NvNumberInput

Numeric input wrapper around Element Plus `ElInput`, with repository-owned inner-field geometry and theme styles. This is not ElInputNumber: it adds a numeric type and minimum inner width, not explicit numeric coercion or a custom stepper.

## Source Files Used

- `NvNumberInput.vue:1–30`: ElInput rendering, attributes/slot forwarding, model event and exposed input.
- `number-input.shared.ts:3–13`: size union/default and untyped model declaration.
- `number-input.styled.ts:15–80`: every size/state/layout rule.
- `number-input.stories.ts:7–40`: size, placeholder and initial content examples, not additional component props.
- `packages/ui/src/themes/light.ts:4–22,132–137` and `packages/ui/src/themes/dark.ts:5–23,133–138`: theme.numberInput.
- `packages/design-tokens/src/main.ts:3–104`: canonical font families, colors, spacing, typography, radii, borders, shadow and transition.
- `packages/ui/src/utils/css-in-js.ts:16–55,88–148`: typography, radius, horizontal padding and icon offsets.
- `packages/ui/src/themes/light.ts` and `packages/ui/src/themes/dark.ts`: exact theme mappings. Runtime `polished` evaluation resolves dark background `#333` (= `#333333`), dark selected default `#515151`, and dark plain fill `#acacac` (= `#ACACAC`).
- `packages/ui/src/styles/main.scss:1–3` and `packages/ui/src/styles/fonts.scss`: shared Tailwind reset and font provisioning. Family is inherited, not assigned by the local styled components; intended sans stack is `tokens.fontFamily.sans` (Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"). Font loading and consumer inheritance affect actual rendering.

## Component Axes

| Property / passthrough | Values                                                                                                     | Default       | Current behavior                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `size`                 | `sm`, `md`, `lg`                                                                                           | `md`          | Local inner-field height, radius, horizontal padding and font size. Consumed by wrapper, not an ElInput size prop.                                                                                 |
| `modelValue`           | untyped runtime `{}` prop                                                                                  | undefined     | Forwarded to ElInput as model-value; no local coercion/validation.                                                                                                                                 |
| `$attrs`               | native / ElInput props and listeners, e.g. type, placeholder, disabled, readonly, clearable, show-password | delegated     | Explicitly v-bound to ElInput; default attribute inheritance is not disabled, so root-wrapper attributes/listeners can also exist. Actual DOM delivery is delegated to Vue/styled wrapper/ElInput. |
| Slots                  | all supplied slot names with scope                                                                         | none supplied | Every slot forwards to ElInput with `scope \|\| {}`; no authored icon, label, helper or slot chrome.                                                                                               |

The template sets `type="number"` before `v-bind="$attrs"`; a supplied type can override it. It does not call `Number()` on emitted values, enforce bounds or define step behavior.

Events: explicitly re-emits **`update:model-value($event)`** unchanged (template spelling), without a `defineEmits` declaration; other listeners pass through `$attrs`. Exposed `input` is a computed `elInputRef.value.$el.querySelector('input')`, not a guaranteed always-available DOM reference before mount or in textarea mode. No local modelValue default beyond undefined. Stories' `content` initializes a ref but is not a declared prop.

## Size Specification

Pixel equivalents of `rem(...)` below assume a 16px root font size, not a fixed application root. Source lengths remain rem-based; numeric SVG width/height are separately described. Tables describe repository-authored declarations, not a browser-computed snapshot. No local opacity reduction is authored (normal opacity 1); external CSS may override it.

| Size | Inner height  | Radius         | Inner padding left/right | Font size       | Local weight / line-height / tracking |
| ---- | ------------- | -------------- | ------------------------ | --------------- | ------------------------------------- |
| `sm` | 1.5rem / 24px | 0.375rem / 6px | 0.5rem / 8px each        | 0.75rem / 12px  | 600 / 1.4 / 0.02rem (= 0.32px)        |
| `md` | 2rem / 32px   | 0.5rem / 8px   | 1rem / 16px each         | 0.75rem / 12px  | 600 / 1.4 / 0.02rem (= 0.32px)        |
| `lg` | 2.5rem / 40px | 0.5rem / 8px   | 1rem / 16px each         | 0.875rem / 14px | 600 / 1.4 / 0.02rem (= 0.32px)        |

Local `.el-input` line-height is 1, but `.el-input__inner` receives size-specific line-height 1.4. Inner border-width 0.0625rem (= 1px), outline 0, align-items center and transition `all .3s` (300ms). Vertical padding, gap, border style, vendor-wrapper padding/shadow, icon dimensions/color, caret color, text transform/decoration, min/max outer height and overflow are not assigned locally. Do not infer that align-items centers text in a native input. Box-sizing and reset/vendor rules affect the outer rendered box.

Root width is **min-content**, not fixed 80px. Every direct child width is 100%; `.el-input__inner` has width 100% and min-width **5rem (= 80px)** for all sizes. No local max-width or custom number-spin-button styling.

## Variant And State Style Tables

One local visual variant, all three sizes. Rules apply to **`.el-input__inner`**, not the vendor `.el-input__wrapper`. Placeholder is a content style that can coexist with hover/focus, not an exclusive whole-field state. Icon styling is delegated, not proven to equal field text color.

| Theme | State               | Inner text | Inner background           | Inner border width / color | Inner shadow / placeholder                    |
| ----- | ------------------- | ---------- | -------------------------- | -------------------------- | --------------------------------------------- |
| light | rest                | `#444444`  | `#ffffff`                  | 0.0625rem / 1px; `#EBEBEB` | `none locally assigned`                       |
| light | hover               | `#444444`  | `#ffffff`                  | 0.0625rem / 1px; `#DCDCDC` | `none locally assigned`                       |
| light | focus               | `#444444`  | `#ffffff`                  | 0.0625rem / 1px; `#DCDCDC` | `0 0 0 0.25rem #F9F9FC`                       |
| light | placeholder content | `#BEBEBE`  | underlying field unchanged | underlying state unchanged | Placeholder weight 300; inherits size metrics |
| dark  | rest                | `#DCDCDC`  | `#333`                     | 0.0625rem / 1px; `#444444` | `none locally assigned`                       |
| dark  | hover               | `#DCDCDC`  | `#333`                     | 0.0625rem / 1px; `#626262` | `none locally assigned`                       |
| dark  | focus               | `#DCDCDC`  | `#333`                     | 0.0625rem / 1px; `#626262` | `0 0 0 0.25rem #444444`                       |
| dark  | placeholder content | `#818181`  | underlying field unchanged | underlying state unchanged | Placeholder weight 300; inherits size metrics |

Focus follows hover with equal pseudo-selector specificity, so focus border wins if both match; focus ring remains during hover. No active/selected/loading/invalid/disabled/readonly branches are authored locally. Native/ElInput disabled and readonly can be supplied through attributes and affect actual interaction; those are **delegated supported semantics**, not locally specified theme visuals. Local hover selector does not exclude disabled/readonly, and effective third-party disabled styles depend on stylesheet specificity/order. ElInput validation and clear/password icons, prepend/append/prefix/suffix content and textarea mode are vendor/consumer behavior; this table must not be extrapolated into their complete styling.

## Structure / Anatomy

| Part                            | Source of truth                               | Visual / layout role                                                                                                                                                                               |
| ------------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root div                        | styled wrapper                                | Inline-flex; direct children width 100%; attribute fallthrough may add wrapper attrs/listeners. No local surface/radius/clip.                                                                      |
| ElInput root and nested wrapper | vendor ElInput                                | `.el-input` local line-height 1; any vendor wrapper fills, borders, padding and shadows remain delegated.                                                                                          |
| Native `.el-input__inner`       | local styled selectors plus vendor/native CSS | Authored height, radius, horizontal padding, font metrics, theme fill/text/border, focus ring, placeholder style. Build these layers here rather than transferring them silently to the outer div. |
| All supplied slots              | Vue slot forwarding                           | Consumer and vendor layout, not fixed design-system glyph/content geometry.                                                                                                                        |

## Token Mapping

| Concern             | Token / helper                                 | Values / context                                                                                           |
| ------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Heights             | spacing[6/7/8] via rem                         | 24/32/40px at 16px root                                                                                    |
| Radius              | borderRadiusStyleBySize → sm/md/DEFAULT        | 6/8/8px at 16px root                                                                                       |
| Horizontal padding  | horizontalPaddingStyleBySize → spacing[3/5]    | 8/16/16px each side at 16px root                                                                           |
| Type metrics        | fontSize[1/2], fontSizeStyle                   | 12/12/14px, 1.4 unitless, 0.02rem tracking; font-weight 600 local, 300 placeholder                         |
| Border and focus    | borderWidth.DEFAULT / lg                       | 0.0625rem / 0.25rem (= 1px / 4px); focus spread only, no blur/offset                                       |
| Transition          | transition.DEFAULT                             | `all .3s` on inner field                                                                                   |
| Minimum inner width | explicit rem(80), not spacing token            | 5rem / 80px for every size                                                                                 |
| Theme               | theme.numberInput rest/hover/focus/placeholder | Resolved matrix above; light hover/focus border is gray.30 **#DCDCDC**, placeholder is gray.40 **#BEBEBE** |

## Recommended Figma Mapping

| Property     | Kind                 | Values                                                                        |
| ------------ | -------------------- | ----------------------------------------------------------------------------- |
| Size / Theme | variants             | sm / md / lg; light / dark                                                    |
| Interaction  | variant              | rest / hover / focus; focus+hover follows focus border                        |
| Placeholder  | text/content boolean | Independent empty/placeholder content; do not change underlying state surface |

## Figma Build Notes

- Model the inner surface separately from the vendor wrapper. Fixed inner height is not proof of total ElInput height with vendor padding.
- Keep prefix/suffix/prepend/append layers detached unless consumer/vendor evidence supplies geometry; do not assign invented icon color/size.
- Render placeholder with weight 300, normal text 600; use actual inherited sans font, not a local family declaration that does not exist.
- Treat disabled/readonly visuals as a separately verified vendor reconstruction, not additional authored variant rows.

## Gaps / Assumptions

- Imported `element-plus/lib/components/input/style/css` is authoritative for additional vendor styling; no computed DOM/CSS or vendor input stylesheet resolution was performed here. Outer wrapper padding/shadows, vertical padding, icon and disabled/error visuals remain unproven.
- Native browser behavior and attribute/listener duplication through root fallthrough have not been exercised. Supplying `type=textarea` delegates to ElInput's other DOM; these `.el-input .el-input__inner` rules do not establish textarea geometry.
- No local sanitization, validation, numeric conversion, spinner UI or minimum/maximum value API. No browser-specific rounding/step behavior is asserted.
