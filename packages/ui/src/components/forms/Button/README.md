# NvButton

General-purpose native button with five visual types, four sizes, optional trailing icon, independent selection and loading, and automatic square mode for an empty default slot.

## Source Files Used

- `NvButton.vue:1–40`: structure, empty-slot squaring, loading directive and icon keys.
- `button.shared.ts:5–47`: all props/defaults; the exported size list repeats `xs`, but the semantic union has four sizes.
- `button.styled.ts:18–71,73–226`: geometry, every variant/state branch and icon positioning.
- `button.stories.ts:43–81`: examples, with hard-coded label text.
- `packages/ui/src/components/typography/Icon/NvIcon.vue:1–21`: SVG dimensions and `currentColor`, not the unused `icon.styled.ts`.
- `packages/ui/src/utils/vue.ts:3–15`: actual VNode emptiness test.
- `packages/ui/src/main.ts:17–50`, `packages/ui/src/styles/main.scss:19–23`, `packages/ui/src/styles/index.ts:1–3`: shared loading rules and stylesheet imports.
- `packages/design-tokens/src/main.ts:3–104`: canonical font families, colors, spacing, typography, radii, borders, shadow and transition.
- `packages/ui/src/utils/css-in-js.ts:16–55,88–148`: typography, radius, horizontal padding and icon offsets.
- `packages/ui/src/themes/light.ts` and `packages/ui/src/themes/dark.ts`: exact theme mappings. Runtime `polished` evaluation resolves dark background `#333` (= `#333333`), dark selected default `#515151`, and dark plain fill `#acacac` (= `#ACACAC`).
- `packages/ui/src/styles/main.scss:1–3` and `packages/ui/src/styles/fonts.scss`: shared Tailwind reset and font provisioning. Family is inherited, not assigned by the local styled components; intended sans stack is `tokens.fontFamily.sans` (Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"). Font loading and consumer inheritance affect actual rendering.

## Component Axes

| Property / content | Values                                             | Default   | Current behavior                                                                                                                                                                             |
| ------------------ | -------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`             | `default`, `plain`, `ghost`, `ghost-alt`, `active` | `default` | Visual variant; `active` here is not the `:active` pseudo-state.                                                                                                                             |
| `size`             | `xs`, `sm`, `md`, `lg`                             | `md`      | Height, radius, typography, padding, square width, icon dimensions/offset.                                                                                                                   |
| `selected`         | Boolean                                            | `false`   | Independent from hover/active/focus; see precedence below.                                                                                                                                   |
| `squared`          | Boolean                                            | `false`   | Effective value is `squared \|\| isVNodeEmpty($slots.default)`; can square a text button too.                                                                                                |
| `iconName`         | string                                             | `''`      | Truthy name reserves icon padding and renders NvIcon; actual icon lookup matches name or `nv-` prefix. Unknown names have no defined fallback glyph.                                         |
| `loading`          | Boolean                                            | `false`   | Element Plus `ElLoadingDirective`, not a disabled binding.                                                                                                                                   |
| `align`            | CSS `text-align` type                              | `''`      | Directly written as `justify-content`; no default justification is assigned locally. Not all accepted text-align values are valid justify-content. Square mode overrides it with center.     |
| default slot       | label / arbitrary content                          | absent    | Rendered inside a span only when helper regards it nonempty. No `content` prop. Missing slot is empty; comments/childless VNodes are checked by the helper, not rendered visual measurement. |

No declared component emits, model, disabled or readonly props. Native attributes/listeners fall through to the native button through the styled root. Native `disabled` can suppress native activation; there is no local disabled visual selector and the theme's disabled/readonly entries are unused. `readonly` is not a native button behavior. Visual `type` is consumed, not an HTML submit/reset type API; native button form behavior is not explicitly set by this component.

## Size Specification

Pixel equivalents of `rem(...)` below assume a 16px root font size, not a fixed application root. Source lengths remain rem-based; numeric SVG width/height are separately described. Tables describe repository-authored declarations, not a browser-computed snapshot. No local opacity reduction is authored (normal opacity 1); external CSS may override it.

| Size | Height / squared width | Radius         | No-icon padding left/right | With-icon padding left/right | Font size       | SVG icon width × height | Nonsquare icon right |
| ---- | ---------------------- | -------------- | -------------------------- | ---------------------------- | --------------- | ----------------------- | -------------------- |
| `xs` | 1rem / 16px            | 0.25rem / 4px  | 0.25rem / 4px each         | 0.25rem / 4px; 1rem / 16px   | 0.75rem / 12px  | 12px × 12px             | 0.125rem / 2px       |
| `sm` | 1.5rem / 24px          | 0.375rem / 6px | 0.5rem / 8px each          | 0.5rem / 8px; 1.5rem / 24px  | 0.75rem / 12px  | 16px × 16px             | 0.25rem / 4px        |
| `md` | 2rem / 32px            | 0.5rem / 8px   | 1rem / 16px each           | 1rem / 16px; 2rem / 32px     | 0.75rem / 12px  | 24px × 24px             | 0.25rem / 4px        |
| `lg` | 2.5rem / 40px          | 0.5rem / 8px   | 1rem / 16px each           | 1.5rem / 24px; 2.5rem / 40px | 0.875rem / 14px | 24px × 24px             | 0.5rem / 8px         |

All sizes: weight 600, unitless line-height 1.4, tracking 0.02rem (= 0.32px); no authored text transform/decoration. Nonsquare width is content-driven with no local min/max width, gap, vertical padding or wrapping/ellipsis rule. Vertical padding and solid border style depend on the shared reset/native CSS, not a local `padding-y:0` declaration. Root is relative inline-flex, align-items center, flex-shrink 0, overflow hidden, outline 0 and transition `all .3s` (300ms). Square mode sets all padding to 0 and centers children; fixed width does not guarantee fitting arbitrary slot content. Border-width is 0.0625rem (= 1px), except visual type `active` uses 0.125rem (= 2px). Outer box dimensions depend on box-sizing/reset; no local box-sizing rule is authored.

## Variant And State Style Tables

These are **50 isolated rows**: five visual variants × two themes × rest/hover/active/focus/selected. Pseudo-state rows assume `selected=false` and only the named pseudo-state; selected rows assume no pseudo-state. Text and actual SVG fill share the text color (`currentColor`); radius follows size, and no local state opacity change occurs. Border columns give authored width and color, not a locally declared border style. `S` is exactly `tokens.boxShadow.DEFAULT = 0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)` (at 16px root: y-offset 2px, blur 1.008px, not exactly 1px). Focus shadows have zero offset/blur and 0.25rem (= 4px) spread.

### Light

| Variant     | State    | Text / icon fill | Background    | Border width / color            | Shadow                  |
| ----------- | -------- | ---------------- | ------------- | ------------------------------- | ----------------------- |
| `default`   | rest     | `#444444`        | `#ffffff`     | 0.0625rem / 1px / `#EBEBEB`     | `none`                  |
| `default`   | hover    | `#444444`        | `#F9F9FC`     | 0.0625rem / 1px / `#EBEBEB`     | `none`                  |
| `default`   | active   | `#444444`        | `#DCDCDC`     | 0.0625rem / 1px / `#EBEBEB`     | `none`                  |
| `default`   | focus    | `#444444`        | `#ffffff`     | 0.0625rem / 1px / `#EBEBEB`     | `0 0 0 0.25rem #F9F9FC` |
| `default`   | selected | `#444444`        | `#EBEBEB`     | 0.0625rem / 1px / `#EBEBEB`     | `none`                  |
| `plain`     | rest     | `#ffffff`        | `#0E0E2C`     | 0.0625rem / 1px / `#0E0E2C`     | `none`                  |
| `plain`     | hover    | `#ffffff`        | `#2B2B2C`     | 0.0625rem / 1px / `#2B2B2C`     | `none`                  |
| `plain`     | active   | `#ffffff`        | `#626262`     | 0.0625rem / 1px / `#626262`     | `none`                  |
| `plain`     | focus    | `#ffffff`        | `#0E0E2C`     | 0.0625rem / 1px / `#0E0E2C`     | `0 0 0 0.25rem #626262` |
| `plain`     | selected | `#ffffff`        | `#444444`     | 0.0625rem / 1px / `#444444`     | `none`                  |
| `ghost`     | rest     | `#444444`        | `transparent` | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | hover    | `#444444`        | `#F9F9FC`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | active   | `#444444`        | `#DCDCDC`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | focus    | `#444444`        | `transparent` | 0.0625rem / 1px / `transparent` | `0 0 0 0.25rem #F9F9FC` |
| `ghost`     | selected | `#444444`        | `#EBEBEB`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | rest     | `#444444`        | `transparent` | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | hover    | `#444444`        | `#F9F9FC`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | active   | `#444444`        | `#DCDCDC`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | focus    | `#444444`        | `transparent` | 0.0625rem / 1px / `transparent` | `0 0 0 0.25rem #F9F9FC` |
| `ghost-alt` | selected | `#444444`        | `#ffffff`     | 0.0625rem / 1px / `transparent` | `S`                     |
| `active`    | rest     | `#444444`        | `#ffffff`     | 0.125rem / 2px / `#0E0E2C`      | `none`                  |
| `active`    | hover    | `#444444`        | `#F9F9FC`     | 0.125rem / 2px / `#0E0E2C`      | `none`                  |
| `active`    | active   | `#444444`        | `#DCDCDC`     | 0.125rem / 2px / `#0E0E2C`      | `none`                  |
| `active`    | focus    | `#444444`        | `#ffffff`     | 0.125rem / 2px / `#0E0E2C`      | `0 0 0 0.25rem #F9F9FC` |
| `active`    | selected | `#444444`        | `#EBEBEB`     | 0.125rem / 2px / `#0E0E2C`      | `none`                  |

### Dark

| Variant     | State    | Text / icon fill | Background    | Border width / color            | Shadow                  |
| ----------- | -------- | ---------------- | ------------- | ------------------------------- | ----------------------- |
| `default`   | rest     | `#DCDCDC`        | `#333`        | 0.0625rem / 1px / `#444444`     | `none`                  |
| `default`   | hover    | `#DCDCDC`        | `#444444`     | 0.0625rem / 1px / `#444444`     | `none`                  |
| `default`   | active   | `#DCDCDC`        | `#2B2B2C`     | 0.0625rem / 1px / `#444444`     | `none`                  |
| `default`   | focus    | `#DCDCDC`        | `#333`        | 0.0625rem / 1px / `#444444`     | `0 0 0 0.25rem #444444` |
| `default`   | selected | `#DCDCDC`        | `#515151`     | 0.0625rem / 1px / `#444444`     | `none`                  |
| `plain`     | rest     | `#444444`        | `#acacac`     | 0.0625rem / 1px / `#acacac`     | `none`                  |
| `plain`     | hover    | `#444444`        | `#BEBEBE`     | 0.0625rem / 1px / `#BEBEBE`     | `none`                  |
| `plain`     | active   | `#444444`        | `#9F9F9F`     | 0.0625rem / 1px / `#9F9F9F`     | `none`                  |
| `plain`     | focus    | `#444444`        | `#acacac`     | 0.0625rem / 1px / `#acacac`     | `0 0 0 0.25rem #acacac` |
| `plain`     | selected | `#444444`        | `#acacac`     | 0.0625rem / 1px / `#acacac`     | `none`                  |
| `ghost`     | rest     | `#DCDCDC`        | `transparent` | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | hover    | `#DCDCDC`        | `#444444`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | active   | `#DCDCDC`        | `#2B2B2C`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost`     | focus    | `#DCDCDC`        | `transparent` | 0.0625rem / 1px / `transparent` | `0 0 0 0.25rem #444444` |
| `ghost`     | selected | `#DCDCDC`        | `#515151`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | rest     | `#DCDCDC`        | `transparent` | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | hover    | `#DCDCDC`        | `#444444`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | active   | `#DCDCDC`        | `#2B2B2C`     | 0.0625rem / 1px / `transparent` | `none`                  |
| `ghost-alt` | focus    | `#DCDCDC`        | `transparent` | 0.0625rem / 1px / `transparent` | `0 0 0 0.25rem #444444` |
| `ghost-alt` | selected | `#DCDCDC`        | `#333`        | 0.0625rem / 1px / `transparent` | `S`                     |
| `active`    | rest     | `#DCDCDC`        | `#333`        | 0.125rem / 2px / `#acacac`      | `none`                  |
| `active`    | hover    | `#DCDCDC`        | `#444444`     | 0.125rem / 2px / `#acacac`      | `none`                  |
| `active`    | active   | `#DCDCDC`        | `#2B2B2C`     | 0.125rem / 2px / `#acacac`      | `none`                  |
| `active`    | focus    | `#DCDCDC`        | `#333`        | 0.125rem / 2px / `#acacac`      | `0 0 0 0.25rem #444444` |
| `active`    | selected | `#DCDCDC`        | `#515151`     | 0.125rem / 2px / `#acacac`      | `none`                  |

### Independent state precedence

Source `button.styled.ts:95–219` writes selected values as base-class declarations, not a selected pseudo-class. Under normal generated CSS specificity, `:hover`/`:active` are more specific than that base: selected + hover uses hover fill (also hover border for plain); selected + active uses active fill (also active border for plain). Active follows hover and wins when both match. Focus does not change fill/border: selected + focus retains selected fill/border and adds the focus shadow. For ghost-alt only, selected's base `S` shadow remains on hover/active, but the more-specific `:focus` ring **replaces** `S` rather than stacking it. Hover/active/focus can coexist; focus ring remains during hover/active. No disabled guard excludes these pseudo-selectors. This is a source/cascade reading, not a browser-tested generated-style assertion.

### Loading: local, shared and delegated scope

| Layer / condition                                                              | Source-owned values                                                                                                                  | Limits                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `loading=true` on StButton                                                     | `v-loading` applies Element Plus loading behavior; root overflow hidden clips descendants to the button box/radius.                  | No authored label hiding, opacity change or native disabled binding. Overlay interception is not equivalent to disabled semantics.                                                                                                                                                    |
| UI shared stylesheet loaded                                                    | `.el-loading-spinner { width:auto !important; left:50%; transform:translateX(-50%); }` (`styles/main.scss:19–23`).                   | Shared repository override, not button-local CSS; applies to every matching spinner wherever present. Vertical position, SVG dimensions/animation and mask positioning remain vendor-defined.                                                                                         |
| Mask is a DOM descendant of a rendered **themed GlobalStyles** wrapper         | `.el-loading-mask` background from `disabledItemBackgroundStyle`: light `rgba(255,255,255,0.9)`, dark `rgba(51,51,51,0.9)`.          | Background alpha 0.9, not `opacity:0.9`. GlobalStyles is exported as a styled div, not automatically an unscoped global rule; teleported/body masks outside it do not match.                                                                                                          |
| GlobalStyles descendant `.el-loading-mask .el-loading-spinner .circular .path` | Source interpolation fragments resolve `r:0.5rem` (= 8px), `stroke:#444444` light / `#DCDCDC` dark, `stroke-width:0.125rem` (= 2px). | **Source omits semicolons between these three lines** (`packages/ui/src/main.ts:44–46`). These are authored fragments, not verified effective CSS declarations. Do not repair the syntax or promise their application; CSS-in-JS serialization and browser/SVG handling are unproven. |
| Vendor loading stylesheet                                                      | `styles/index.ts:3` imports Element Plus loading CSS; NvButton imports the directive.                                                | Exact vendor mask defaults, spinner top/margin, animation/dimensions, z-index and interactions with repository import order are not established by local declarations. Do not invent them.                                                                                            |

## Structure / Anatomy

| Part                | Source                                           | Reconstruction                                                                                                                                                                                                                                              |
| ------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Native root button  | `StButton`, `button.styled.ts:73–219`            | Main frame; surface/stroke/focus or selection shadow live here. Clip descendant content, not the root's own external shadow.                                                                                                                                |
| Optional label span | `NvButton.vue:9–11`                              | Consumer content; no separate local span typography, gap or truncation.                                                                                                                                                                                     |
| Optional icon       | `NvButton.vue:12–17`; `button.styled.ts:221–225` | Pointer-events none. Nonsquare: absolute trailing icon with size-dependent right offset, no explicit top coordinate; centered flex context. Square: normal flow, no right offset. Icon reserve is padding, not a gap. No icon-local transition declaration. |
| Loading descendants | Element Plus directive plus shared styles above  | Separate busy overlay; conditional on loading and stylesheet/wrapper scope.                                                                                                                                                                                 |

## Token Mapping

| Concern                     | Token / helper                                                      | Resolved values / context                                                                            |
| --------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Height and square width     | spacing[5/6/7/8] via rem                                            | 16/24/32/40px at 16px root                                                                           |
| Font size and metrics       | fontSize[1/2], fontSizeStyle                                        | 12/14px; line-height 1.4; tracking 0.02rem                                                           |
| Actual SVG dimensions       | NvButton keys 1/3/5/5 → NvIcon `tokens.fontSize[key][0]`            | Numeric width/height 12/16/24/24, not spacing values; pixel-scale SVG attributes, not rem conversion |
| No-icon / with-icon padding | horizontalPaddingStyleBySize / horizontalPaddingWithIconStyleBySize | Full per-size table above; reserves do not scale directly with measured glyph bounds                 |
| Radius / icon offset        | borderRadiusStyleBySize / iconStyleBySize                           | 4/6/8/8px radii; 2/4/4/8px offsets at 16px root                                                      |
| Border / focus spread       | borderWidth.DEFAULT / borderWidth.lg                                | 1px / 4px at 16px root; active border is explicit rem(2)                                             |
| Selected ghost-alt shadow   | boxShadow.DEFAULT                                                   | Exact `S` above; theme selected.boxShadow color is **not consumed**                                  |
| Transition                  | transition.DEFAULT                                                  | Root `all .3s`; no independent icon transition                                                       |

## Recommended Figma Mapping

| Property               | Kind                 | Values                                                                     |
| ---------------------- | -------------------- | -------------------------------------------------------------------------- |
| Variant                | variant              | default / plain / ghost / ghost-alt / active                               |
| Size / Theme           | variants             | xs / sm / md / lg; light / dark                                            |
| Interaction            | variant              | rest / hover / active / focus; combine focused with hover/active as needed |
| Selected / Loading     | independent booleans | false / true, not mutually exclusive interaction states                    |
| Icon / Squared / label | booleans and content | icon visible; square layout; consumer label                                |

## Figma Build Notes

- Use root horizontal Auto Layout, center cross-axis, content-driven width unless square; absolute trailing icon only in nonsquare mode.
- Keep selected and loading independent from pseudo-state variants; apply the precedence above for compounds.
- Preserve clipped content and explicit fixed small height, even when font line-height exceeds the available inner height; do not silently enlarge xs to 20px.
- Distinguish rem-based root geometry from numeric SVG dimensions when reproducing nonstandard root font sizes.

## Gaps / Assumptions

- No browser-computed verification of reset, inherited font, generated-selector specificity, loading scope/serialization, vendor overlay defaults or actual clipping was performed.
- `align` text-align typing versus justify-content use is a current API mismatch; source unchanged.
- `WithIconOnly` story sets `content:''` but its template always renders “this is a button”; it does not prove empty-slot mode. Stories' content arg is not a component prop (`button.stories.ts:43–81`).
- No authored disabled/readonly/invalid visual axis; native disabled semantics are distinct from loading. No ARIA selection/busy semantics are authored.
