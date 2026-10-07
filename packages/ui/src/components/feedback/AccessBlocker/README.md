# NvAccessBlocker Design Notes

Purpose: visually masks wrapped content with a full-cover pointer overlay when access is denied, and centers a reason message. **This is not a keyboard/access-control enforcement component**: original content remains mounted; no `inert`, descendant `disabled`, tab-index rewrite, focus trap, `aria-hidden`, or event guard is applied. Consumers must enforce authorization and keyboard/focus behavior separately.

## Source Files Used

- `NvAccessBlocker.vue:1–28`, `access-blocker.shared.ts:3–19`, `access-blocker.styled.ts:8–19`, `access-blocker.stories.ts`.
- `packages/ui/src/utils/css-in-js.ts:150–154`, `packages/ui/src/themes/{light,dark}.ts` (`disabledItemBackground`, `alert`), `packages/design-tokens/src/main.ts`.
- `packages/ui/src/components/miscellaneous/Center/{NvCenter.vue,center.shared.ts,center.styled.ts}` and `packages/ui/src/components/feedback/Alert/{NvAlert.vue,alert.shared.ts,alert.styled.ts}`; nested typography in `typography/Text/text.styled.ts`.
- `packages/ui/src/styles/{index.ts,main.scss:5–13}`, `packages/ui/tailwind.config.cjs`, `packages/ui/.storybook/preview.js` (global stylesheet and story theme context).
- Pinned `vue3-styled-components@1.2.1`, `package/src/models/StyledComponent.js:21–64` ([registry source](https://registry.npmjs.org/vue3-styled-components/-/vue3-styled-components-1.2.1.tgz)): string-target styled components render `props.as || tagOrComponent`.

## Component Axes

| Property      | Kind / values                 | Default                                      | Behavior                                                                                                                                         |
| ------------- | ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `allowed`     | Boolean                       | false                                        | False mounts reason overlay and adds `overflow-hidden` root utility; true removes overlay (after leave transition) and removes utility           |
| `reason`      | String                        | `''`                                         | Fallback message only; does not set an accessible disabled state                                                                                 |
| `as`          | String tag                    | `div`                                        | Changes root tag through pinned styled-component renderer; positioning remains relative. Native element semantics/reset may vary by selected tag |
| Default slot  | Arbitrary children            | Empty                                        | Always rendered beneath overlay, including while denied                                                                                          |
| `reason` slot | Arbitrary replacement content | `NvAlert size="sm"` containing reason string | Replaces Alert only, **not** the full-size Center or overlay wrappers                                                                            |
| Theme context | Supplied styled ThemeProvider | Consumer context                             | Overlay light/dark values below; Storybook supplies dark, not a runtime prop default                                                             |

`sizeValues = ['xs','sm','md']` is exported from the shared file but there is **no size prop** and no AccessBlocker size axis. No hover, focus, pressed, selected or loading skin is defined.

## Size Specification / Structure / Anatomy

| Part                                   | Layout and geometry                                                                                                                                               | Surface / text                                                                                                                                        |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root `StAccessBlocker`                 | Relative-positioned div by default; dimensions follow content/parent; no own padding, margin, gap, border, radius, width/height/min/max dimension rules           | No fill, shadow, filter or blur rule; typography/color follow parent, not an AccessBlocker theme foreground                                           |
| Original content                       | Default slot remains in normal flow; sizes root                                                                                                                   | Children keep their own styles and behavior. Never assume a fixed child font, icon, color or disabled state                                           |
| Reason overlay `StAccessBlockerReason` | Absolute top/right/bottom/left 0; full root positioning bounds; z-index 3000                                                                                      | Theme RGBA fill only; no padding/border/radius/shadow/blur rule; no `pointer-events` override, so normal hit-testing covers content within its bounds |
| Center (`NkCenter` import is NvCenter) | `w-full h-full` → width/height 100%; default block flex, align-items center, justify-content center; flex-direction row and nowrap initial values; no gap/padding | Remains present for custom reason slot; large content is not given a special max-width or wrapping policy                                             |
| Fallback Alert                         | Size sm, type info, as div; padding .5rem (8px), min-height 1.5rem (24px), radius .375rem (6px); no fixed dimensions/border/shadow                                | Light info: #0E0E2C fill/white text; dark info: white fill/#0E0E2C text; nested NvText default body typography below                                  |

Denied `overflow-hidden` clips descendants, including the overlay, to root overflow bounds. Root has no local radius, so there is no built-in rounded mask; consumer radius/CSS may change clipping. No root opacity reduction is applied: backdrop alpha is distinct from whole-overlay opacity.

## Variant And State Styles / Token Mapping

| Theme / state   | Layer fill                                                                                                                              | Foreground                                                                   | Effects / visibility                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Light / allowed | Root has no fill; overlay absent after leave                                                                                            | Original children / ancestor context                                         | Root overflow not locally overridden; children remain mounted |
| Light / denied  | `disabledItemBackground.backdropColor` → theme backgroundColor → `colors.white` #ffffff; backdropOpacity .9 → rgba(255,255,255,.9)      | Fallback info Alert white text on #0E0E2C; custom reason is consumer content | Root overflow hidden; full inset overlay z-index 3000         |
| Dark / allowed  | Root has no fill; overlay absent after leave                                                                                            | Original children / ancestor context                                         | Same behavior as light                                        |
| Dark / denied   | `disabledItemBackground.backdropColor` → dark backgroundColor → `darken(.0675)(gray.80)` → #333; backdropOpacity .9 → rgba(51,51,51,.9) | Fallback info Alert #0E0E2C text on white; custom reason is consumer content | Same geometry as light                                        |

Backdrop opacity .9 affects only fill alpha; reason UI is opaque at rest. Overlay element opacity is 1 at rest and animates to/from 0 with the transition.

Fallback typography: NvText explicitly supplies `fontSize.2` → .875rem (14px at 16px root), line-height 1.4, letter-spacing .02rem (.32px at 16px root), full sans stack `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. Inline `color: inherit` resolves to the Alert foreground above, overriding Text's ordinary theme color. Font-weight and alignment are not set by Alert/body Text: they follow ancestor/native context (normal weight/start alignment absent overrides). Custom reason content need not use this typography. Root/Center have no independent font-size/color declaration; with the package's Tailwind preflight they use the same sans family and 1.5 line-height unless a parent changes them. In the story the Card ancestor explicitly has `font-size: 0`, but its nested NvText/Alert restore their own body text size.

## Interaction And Motion

- Denied overlay intercepts ordinary pointer hit-testing within the covered/clipped bounds; it does not set `pointer-events: none` on children, stop all events, prevent programmatic activation, or block keyboard focus. Focus may remain inside the underlying content when `allowed` changes.
- The unnamed Vue `<Transition class="transition">` uses default `v-enter-*` / `v-leave-*` classes; it does not select a transition named `transition`.
- With `packages/ui/src/styles/main.scss` loaded (via styles/index.ts, including Storybook), `.v-enter-active` / `.v-leave-active` declare **`transition: all 0.3s` (300ms, default ease)**; `.v-enter-from` / `.v-leave-to` set opacity 0. No transform/blur is declared. Entry fades 0→1, exit 1→0; leave retains overlay until transition finishes. The Tailwind `transition` class is also passed through; unnamed Vue classes provide the explicit 300ms declaration.
- No `appear` is requested: the initial denied overlay is rendered without an initial appear fade. The duration/classes are global, not a local AccessBlocker token. Without the global CSS, this folder supplies no standalone fade timing. The root overflow class changes with `allowed`, not at animation completion.

## Recommended Figma Mapping / Figma Build Notes

| Property       | Mapping                                                           |
| -------------- | ----------------------------------------------------------------- |
| State          | allowed / denied from `allowed`                                   |
| Theme          | light / dark overlay and fallback colors                          |
| Reason content | Default Alert instance or custom nested slot; keep Center wrapper |

Use one content-sized positioning frame, denied-only clipping, absolute inset overlay, and full-size centered reason frame. Use RGBA fill, not .9 opacity on the entire overlay. Animate only its opacity to reproduce the evidenced change. Keep original content present underneath; do not draw it as automatically disabled. Slot content stays freeform rather than an invented variant catalog.

## Gaps / Assumptions

- Actual content dimensions, consumer styles, custom reason UI, inherited parent font/color, native `as` behavior and focus policy are contextual; no browser-computed or arbitrary slot values are claimed.
- Rem pixel equivalents assume a 16px document root; custom root font-size scales fallback Alert geometry and typography.
- Application authorization and keyboard disabling are outside this implementation. The mask must not be treated as an authorization guarantee.
