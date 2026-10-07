# NvPopover Design Spec

Purpose: an anchored Ark popover with a nested Card surface and a custom pointer shield. This documents baseline `3390fc0378a7f6e055d4cd4804d765599b4adeb6`; inactive styling is not promoted to current output.

## Source Evidence

- [NvPopover.vue](./NvPopover.vue), lines 2–43 and 57–60: local state, positioning, portal, shield, slots, nested Card.
- [popover.shared.ts](./popover.shared.ts), lines 4–16: public axes; [popover.styled.ts](./popover.styled.ts), lines 13–38: conditional injected selector.
- [Card shared props](../../display/Card/card.shared.ts), lines 3–15, and [Card styles](../../display/Card/card.styled.ts), lines 10–37: actual surface.
- [CSS helpers](../../../utils/css-in-js.ts), lines 40–85; [tokens](../../../../../design-tokens/src/main.ts); [light](../../../themes/light.ts) and [dark](../../../themes/dark.ts) themes.
- [Shared Vue transitions](../../../styles/main.scss), lines 5–13, imported through [styles index](../../../styles/index.ts) / [UI entry](../../../main.ts); [story](./popover.stories.ts).
- Pinned dependency evidence: `@ark-ui/vue@3.11.0/dist/components/popover/use-popover.js`, lines 13–30; `popover-content.vue.js`, lines 9–22; `@zag-js/popover@0.65.1/src/popover.machine.ts`, lines 18–29, 134–207, 231–249; `@floating-ui/vue@0.2.1/src/types.d.ts`, lines 1–5: re-export of the placement/configuration types used by local props. Versions are pinned in repository `package-lock.json`. Installed vendor files are under `../audit-tools/node_modules` relative to the repository root.
- Default host retention evidence: `@ark-ui/vue@3.11.0/dist/components/popover/popover-root.vue.js`, lines 21–22 and 38–40; `popover-positioner.vue.js`, lines 15–29; `dist/components/presence/use-presence.js`, lines 32–39.
- Positioner evidence: `@zag-js/popover@0.65.1/src/popover.connect.ts`, lines 15–18 and 85–91; `@zag-js/popper@0.65.1/src/get-styles.ts`, lines 16–54: floating-layer geometry, separate from Card sizing.

## Component Axes

| Property     | Kind                               | Values                                                                                                                                       | Default      | Notes                                                                                                 |
| ------------ | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------- |
| `placement`  | String, Floating UI placement type | `top`, `top-start`, `top-end`, `right`, `right-start`, `right-end`, `bottom`, `bottom-start`, `bottom-end`, `left`, `left-start`, `left-end` | `bottom-end` | Requested placement; automatic flip is enabled. Imported config property is optional at the TS level. |
| `size`       | String union                       | `sm`, `md`, `lg`                                                                                                                             | `md`         | Passed directly to Card; Card supports only `xs`, `sm`, `md`, so `lg` uses base fallback padding.     |
| `reference`  | Named slot                         | Trigger content                                                                                                                              | Empty        | Rendered inside `Popover.Trigger asChild`; appearance belongs to consumer.                            |
| Default slot | Content                            | Consumer content                                                                                                                             | Empty        | Inside Card; no dedicated content prop.                                                               |
| Open state   | Internal behavior                  | Open / closed                                                                                                                                | `ref(false)` | Root `v-model:open` updates local state; no declared public `open` prop or component emit.            |

`autoFocus=false`, `portalled` and Root `asChild` are explicit internal settings, not public axes. There is no local variant, disabled, loading, arrow, title or footer prop/slot. Undeclared fallthrough attributes are not a documented public Ark configuration API.

## Size Specification — Actual Card Surface

| Popover size   | Height / width                               | Padding on all sides                | Radius                       | Stroke             | Shadow              | Typography                   |
| -------------- | -------------------------------------------- | ----------------------------------- | ---------------------------- | ------------------ | ------------------- | ---------------------------- |
| `sm`           | Content-driven; inline `max-width: rem(300)` | `spacing.3 = 8px`                   | `borderRadius.DEFAULT = 8px` | No border declared | `boxShadow.DEFAULT` | Card declares `font-size: 0` |
| `md` (default) | Same                                         | `spacing.5 = 16px`                  | 8px                          | No border declared | Same                | Same                         |
| `lg`           | Same                                         | **`spacing.3 = 8px` base fallback** | 8px                          | No border declared | Same                | Same                         |

The `lg` value is accepted by Popover's union but absent from Card's size-style record: lookup returns undefined, leaving the Card base 8px padding. It is **not** a 16px duplicate of `md`. The Card has no min-width, fixed width, fixed height, content gap or layout direction. The separate Ark Positioner has vendor `min-width: max-content`; do not confuse this floating-layer minimum with a numeric Card minimum. Token `rem()` equivalents assume a 16px root. Card does not clip content: its `overflow: hidden` line is commented out. Children must supply usable text styles; raw inherited text is not guaranteed to display because the Card sets font-size 0. Story supplies `NvText`, but arbitrary slot content has no fixed typography, dimensions or icon size.

## Variant And State Styles — Active Baseline

| Theme | State / part         | Fill                                                             | Text / icon                     | Stroke        | Effects                                                                                          |
| ----- | -------------------- | ---------------------------------------------------------------- | ------------------------------- | ------------- | ------------------------------------------------------------------------------------------------ |
| Light | Open Card, all sizes | `theme.card.backgroundColor = colors.white = #ffffff`            | Child-defined; Card font-size 0 | None declared | 8px radius; `boxShadow.DEFAULT`                                                                  |
| Dark  | Open Card, all sizes | `theme.card.backgroundColor = darken(0.0675, gray.80) = #333`    | Child-defined; Card font-size 0 | None declared | Same                                                                                             |
| Both  | Pointer shield open  | No fill declared                                                 | N/A                             | None          | Fixed inset 0, pointer-events auto, z-index 9999; transparent interaction layer, not a dim scrim |
| Both  | Closed               | Card removed after leave transition; shield hidden with `v-show` | N/A                             | N/A           | No local alternate closed skin                                                                   |
| Both  | Enter / leave Card   | Same fill                                                        | Same                            | Same          | Shared 300ms fade, detailed below                                                                |

`boxShadow.DEFAULT = 0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`; no spread specified. There is no local hover/focus/active/selected/disabled/loading surface appearance or focus ring. Child components may provide their own states.

## Inactive / Conditional Styling — Not Current Surface Output

`StPopover` calls `injectGlobal` for `[data-theme="popover-${props.size}"]`. **No such attribute is attached to the Root, Positioner, Content or Card in `NvPopover.vue`.** Ark's Content implementation does not supply this custom theme name. These rules only affect an element that some other code explicitly gives the matching attribute; injecting a rule is not attaching its selector.

| Selector / rule               | Conditional value                                                                                                  | Current baseline status                                                                        |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `popover-sm` padding / radius | Helper `paddingStyleBySize('sm')` = 8px; `borderRadius.sm` = 6px                                                   | Inactive; actual Card radius is 8px                                                            |
| `popover-md` padding / radius | Helper padding = 16px; `borderRadius.md` = 8px                                                                     | Inactive                                                                                       |
| `popover-lg` padding / radius | Helper padding = 16px; `borderRadius.DEFAULT` = 8px                                                                | Inactive; actual `lg` Card fallback padding is 8px                                             |
| Theme fill                    | `theme.popover.backgroundColor`: light `#ffffff`, dark `#333`                                                      | Inactive; actual owner is `theme.card.backgroundColor`                                         |
| Border color / width          | `theme.popover.borderColor`: light `gray.20 #EBEBEB`, dark `gray.80 #444444`, important; `borderWidth.DEFAULT=1px` | Inactive; no visible popover stroke established; selector does not declare border-style either |
| Shadow                        | `boxShadow.lg`, important, same current literal as DEFAULT                                                         | Inactive; actual owner is Card `boxShadow.DEFAULT`                                             |

Matching fill/shadow literals do not make their token ownership interchangeable. Do not apply this table to Figma's baseline component.

## Structure / Anatomy

| Part                   | Source                                                                 | Role                                                                                                                                                                                                                                        |
| ---------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ark Root + `StPopover` | Root `asChild`, styled div                                             | State/context wrapper; styled div has no direct visual box-model rules.                                                                                                                                                                     |
| Trigger                | `reference` slot, Trigger `asChild`                                    | Consumer reference anchor.                                                                                                                                                                                                                  |
| Teleport               | Injected `PORTAL_TARGET` resolved via `getElement`, otherwise `'body'` | Actual DOM ancestry can differ from component ancestry.                                                                                                                                                                                     |
| Pointer shield         | Fixed full-screen div, `v-show="open"`                                 | Stops/prevents click, mouseup and mousedown; no explicit close handler.                                                                                                                                                                     |
| Positioner             | Ark Positioner                                                         | Vendor `position:absolute`, `isolation:isolate`, `min-width:max-content`, `top:0px`, `left:0px`; transform described below. Local inline z-index 9999 overrides vendor `var(--z-index)`. No same-width or fit-viewport sizing is requested. |
| Content                | Ark Content `:hidden="false"`                                          | Default retained semantic host with local hidden=false override; visible Card is `v-if="open"`. No custom data-theme is added.                                                                                                              |
| Card + default slot    | Card default variant, explicit size and max width                      | The sole panel surface. No explicit Arrow, Title, Description or CloseTrigger is rendered.                                                                                                                                                  |

## Interaction And Motion

| Concern           | Proven source behavior                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positioning       | `flip: true`, `overflowPadding: spacing.3 = 8px`, `offset.mainAxis: spacing.4 = 12px`. Positioner uses `translate3d(var(--x), var(--y), 0)` when current placement exists; before placement, `translate3d(0, -100vh, 0)` moves it off-screen. Its minimum is `max-content`, not a fixed pixel width; Card still has its independent 18.75rem maximum. Placement may change near boundaries; do not promise bottom-end is always the resulting side. |
| Focus on open     | Explicit `autoFocus=false` overrides Zag's true default; no initial focus move is requested.                                                                                                                                                                                                                                                                                                                                                        |
| Keyboard modality | Zag `modal=false` default is unchanged. Thus modal-only focus trapping, body-scroll prevention and hiding other content are **not** enabled by this component. Nonmodal portalled tab-focus proxying is in the pinned machine.                                                                                                                                                                                                                      |
| Dismissal         | Pinned Zag defaults `closeOnEscape=true`, `closeOnInteractOutside=true`; outside pointer/focus interaction is tracked and trigger excluded. Root `v-model` receives the Ark `update:open` event internally.                                                                                                                                                                                                                                         |
| Custom shield     | Pointer-blocking div is separate from keyboard-modal behavior. Its stop/prevent handlers do not themselves set `open=false`. Do not equate it to Ark `modal=true` or promise exact outside-click event ordering.                                                                                                                                                                                                                                    |
| Focus after close | Zag conditionally restores trigger focus based on the dismissal event's `restoreFocus` flag; outside interaction sets it based on focusable/contextmenu status. This is not unconditional focus restoration.                                                                                                                                                                                                                                        |
| Shared Vue fade   | Unnamed Transition around `Card v-if="open"` uses `.v-enter-active/.v-leave-active { transition: all 0.3s }` and `.v-enter-from/.v-leave-to { opacity: 0 }` from `styles/main.scss`. This is hard-coded shared 300ms motion, **not** a local `tokens.motion` lookup. Shield is outside that Transition.                                                                                                                                             |

Inherited defaults were verified against pinned Ark/Zag source, not inferred from modern documentation. They describe the state-machine contract; exact shield/capture ordering and focus behavior were not browser-tested. Pinned Ark defaults `lazyMount=false` and `unmountOnExit=false` retain Positioner and Content while closed; the local `:hidden="false"` overrides the semantic host hidden attribute, while Card uses its own `v-if` leave. This is the default host lifecycle, not a promise under explicit caller render-strategy/CSS overrides.

## Token Mapping

| Concern               | Active owner                        | Value                              |
| --------------------- | ----------------------------------- | ---------------------------------- |
| Card padding          | `spacing.3` / `.5`                  | `sm/md/lg` = **8/16/8px**          |
| Card radius           | `borderRadius.DEFAULT`              | 8px, all sizes                     |
| Card fill             | `theme.card.backgroundColor`        | Light #ffffff / dark #333          |
| Card shadow           | `boxShadow.DEFAULT`                 | Exact literal in state table       |
| Max width             | Hard-coded `rem(300)`               | 18.75rem; 300px at 16px root       |
| Placement clearance   | `spacing.4` / `.3`                  | 12px offset / 8px overflow padding |
| Fade / shield z-index | Shared CSS literal / inline literal | 0.3s / 9999                        |

## Recommended Figma Mapping

| Property            | Values                      | Notes                                                                                            |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------------------ |
| Theme               | Light / dark                | Active Card fill, not inactive popover selector                                                  |
| Size                | sm / md / lg                | Padding 8 / 16 / 8px; constant radius                                                            |
| Visibility          | Open / closed               | Card presence and shared fade                                                                    |
| Requested placement | All 12 values in axes table | Annotate floating-layer max-content minimum and transform; flip makes final placement contextual |
| Body content        | Instance/content region     | No fixed text or icon contract                                                                   |

## Figma Build Notes

- Build a content-sized Card capped at 18.75rem with no Card min-width, no stroke, 8px corners and the actual shadow. Represent the outer Positioner separately with its `max-content` minimum rather than inventing a fixed panel width. Keep `lg` as the evidenced fallback, not an invented larger panel.
- Keep anchor, invisible shield and positioner outside the visible panel. Do not draw a dark backdrop or a keyboard-modal layer.
- Keep child text/components detached; require explicit typography rather than assuming a bubble text style.

## Gaps / Assumptions

- `lg` mismatches Card's supported type/size record; the fallback is source truth, not a fix made here.
- Story's `content` control is not a declared prop; body content is the default slot.
- No browser measurement, exact shield-dismiss ordering or arbitrary slot geometry is claimed. Inactive selectors remain documented separately and no app changes are proposed.
