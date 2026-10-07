# NvContextMenu Design Spec

Purpose: click-anchored action menu, with generated option rows and optional separators. This describes source at `3390fc0378a7f6e055d4cd4804d765599b4adeb6`, not a proposed runtime fix.

## Source Evidence

- [NvContextMenu.vue](./NvContextMenu.vue), lines 1–25 and 41–59: slots, generated rows, portal and Tippy defaults.
- [context-menu.shared.ts](./context-menu.shared.ts), lines 4–25: complete declared props; [context-menu.styled.ts](./context-menu.styled.ts), lines 12–21: **injected global** surface selector.
- [NvOption.vue](../../forms/Select/NvOption.vue), lines 1–21, and [select.styled.ts](../../forms/Select/select.styled.ts), lines 140–229: generated row geometry and states.
- [Group props](../../miscellaneous/Group/group.shared.ts), lines 18–40, and [Group styles](../../miscellaneous/Group/group.styled.ts), lines 20–38; [Divider styles](../../miscellaneous/Divider/divider.styled.ts); [Icon](../../typography/Icon/NvIcon.vue).
- [Text styles](../../typography/Text/text.styled.ts), lines 10–14; [CSS helpers](../../../utils/css-in-js.ts); [light theme](../../../themes/light.ts), [dark theme](../../../themes/dark.ts), [tokens](../../../../../design-tokens/src/main.ts).
- [Shared styled wrapper](../../../main.ts), lines 17 and 52–80, and [story](./context-menu.stories.ts), lines 22–34. Dependency versions in repository `package-lock.json`: `vue-tippy@6.7.0`, `tippy.js@6.3.7`.

## Component Axes

| Property                    | Kind            | Values                                                                                                                         | Default                    | Notes                                                                                                |
| --------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `options`                   | Array           | Action `{ type?: 'option', label?: string, icon?: string, disabled?: boolean, onClick?: () => void }` or `{ type: 'divider' }` | `[]`                       | All action fields are optional. Only `type === 'divider'` takes the separator branch.                |
| `tippyOptions`              | Object          | `TippyOptions`                                                                                                                 | `{}`                       | Spread **last** over every local Tippy default.                                                      |
| Default slot                | Trigger content | Consumer content                                                                                                               | Empty                      | The only public slot rendered by this component; it is the reference content, **not** the menu body. |
| `reference` slot            | Unsupported     | —                                                                                                                              | —                          | Story uses this name, but implementation never renders it.                                           |
| Row icon / disabled / label | Option fields   | Present/absent, true/false, text                                                                                               | Unspecified on each action | No separate menu-level disabled, selected, active, readonly, size or loading prop.                   |

The Tippy `content` slot is internal and generated from `options`. Slotted `NvOption` children become **trigger content**, not generated actions. There are no declared component emits or exposed `close()` API; callbacks are `option.onClick`, and vendor callbacks can be supplied through `tippyOptions`.

## Size Specification

| Part               | Width / height                                                                      | Padding                                  | Layout / gap                                                                                      | Radius / stroke                                      | Typography / icon                                                                 |
| ------------------ | ----------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| Menu surface       | `min-width: 150px` (`9.375rem`); local Tippy `maxWidth: 300`; height content-driven | No surface padding set by this folder    | Generated rows in normal block flow; no explicit surface gap                                      | `borderRadius.md = 8px`; `borderWidth.DEFAULT = 1px` | No surface typography; row style supplies it                                      |
| Action row         | `width: 100%`, `height: spacing.7 = 32px`, `min-width: 0`                           | `0 spacing.5` = `0 16px`, both important | Flex, center-aligned, space-between; `.option__content` min-width 0                               | No row border, radius or shadow declared             | `fontSize.2 = 14px`, line-height `1.4`, letter-spacing `0.32px`; weight inherited |
| Icon + label group | Content-driven                                                                      | None declared                            | Group defaults: row, wrap, left-justified, center-aligned; `spacing.3 = 8px` gap, children grow 0 | None declared                                        | Optional Icon `size=3` resolves to a **16px × 16px** SVG; `currentColor`          |
| Horizontal divider | Normal block width, content-free                                                    | No added separator margin or padding     | `border-top: 1px solid`                                                                           | Theme divider border                                 | No label or icon                                                                  |

Row text uses `tokens.fontFamily.sans`: `Nunito, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`. Rows declare nowrap, hidden overflow and text-overflow ellipsis; nested Group itself allows wrapping, so do not promise a particular rendered truncation result for every label/icon combination. No row weight, text transform or decoration is set by `defaultTextStyle`.

Pixel equivalents of token-driven `rem()` declarations use a 16px root; root-size changes scale them. Surface height, min-height and a fixed menu width are not imposed. The selector sets border **width and color**, not border-style; a visible solid stroke depends on shared reset/vendor CSS and is not a standalone guarantee from this folder.

## Variant And State Styles

| Theme        | Part / state      | Foreground / icon                                                                                    | Fill                                                                           | Border                                                             | Effect                                                          |
| ------------ | ----------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------- |
| Light        | Surface open      | Rows supply text                                                                                     | `theme.contextMenu.backgroundColor` = `colors.white` = `#ffffff`               | `theme.contextMenu.borderColor` = `gray.20` = `#EBEBEB`, width 1px | `boxShadow.lg`                                                  |
| Dark         | Surface open      | Rows supply text                                                                                     | `theme.contextMenu.backgroundColor` = `darken(0.0675, gray.80)` = `#333`       | `theme.contextMenu.borderColor` = `gray.80` = `#444444`, width 1px | `boxShadow.lg`                                                  |
| Light        | Enabled row rest  | `theme.text.color` = `gray.80` = `#444444`; icon currentColor                                        | No row fill declaration; menu beneath                                          | None declared                                                      | None declared                                                   |
| Dark         | Enabled row rest  | `theme.text.color` = `gray.30` = `#DCDCDC`; icon currentColor                                        | No row fill declaration; menu beneath                                          | None declared                                                      | None declared                                                   |
| Light        | Enabled row hover | Same as rest                                                                                         | `theme.select.option.hover.backgroundColor` = `gray.10` = `#F9F9FC`, important | None declared                                                      | No row transition declared                                      |
| Dark         | Enabled row hover | Same as rest                                                                                         | `theme.select.option.hover.backgroundColor` = `gray.80` = `#444444`, important | None declared                                                      | No row transition declared                                      |
| Light        | Disabled row      | `theme.select.option.disabled.backgroundColor` = `gray.40` = `#BEBEBE`, used as **color**, important | No disabled fill declaration                                                   | None declared                                                      | `pointer-events: none; user-select: none`; no opacity reduction |
| Dark         | Disabled row      | Same field = `gray.50` = `#9F9F9F`, used as **color**, important                                     | No disabled fill declaration                                                   | None declared                                                      | Same pointer/text-selection suppression                         |
| Light / dark | Divider           | N/A                                                                                                  | None declared                                                                  | `theme.divider.borderColor` = `#EBEBEB` / `#444444`                | None declared                                                   |

`boxShadow.lg = 0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`; x offset 0, y offset 0.125rem, blur 0.063rem, no spread specified. Surface hover/focus/active and generated-row selected/active/readonly/loading variants are not implemented by this wrapper. NvOption supports some additional states, but ContextMenu does not pass them. Do not export them as menu axes.

## Structure / Anatomy

| Part            | Source of truth                             | Role / export note                                                                                 |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `StContextMenu` | Styled div and `injectGlobal`               | Structural wrapper; emits CSS for `[data-theme="context-menu"]` regardless of portal ancestry.     |
| Tippy reference | Default slot                                | Consumer-owned anchor, separate from menu frame.                                                   |
| Tippy surface   | `theme: 'context-menu'`                     | Matching attribute activates this family's injected selector; overriding theme removes that match. |
| Action          | `NvOption` → `.option__content` → `NvGroup` | Generate one row per action; `.option__after` is structurally present but no content is supplied.  |
| Leading icon    | Conditional `NvIcon`                        | No reserved icon placeholder on icon-free rows.                                                    |
| Separator       | `NvDivider direction="horizontal"`          | A 1px rule, no guessed surrounding spacing.                                                        |

## Interaction And Motion

| Concern          | Current source contract                                                                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Trigger / anchor | `trigger: 'click'`, `interactive: true`, placement **`bottom-end`**. Anchored to reference content, not automatically a mouse-position/right-click menu.                                                                                                                     |
| Offset / bounds  | `offset: [0, spacing.4] = [0, 12]`, `maxWidth: 300`; the theme selector imposes 150px minimum width.                                                                                                                                                                         |
| Portal           | `appendTo` is resolved injected `PORTAL_TARGET` via `getElement`, otherwise `document.body`. All these defaults remain overridable by `tippyOptions`.                                                                                                                        |
| Selection        | Enabled click executes `[option.onClick?.(), close()]` left-to-right; then `close()` calls `tippyRef.value?.hide()`. Missing callback still closes. No awaiting of asynchronous callbacks; a synchronous thrown callback prevents the subsequent call.                       |
| Disabled         | Nested row CSS removes pointer interaction; no callback/close is expected from a normal pointer click on the disabled row. Not a guaranteed keyboard-disabled contract.                                                                                                      |
| Fade             | If portal content is a descendant of `GlobalStyles`, its `[data-animation]` rule supplies `transition: all .3s !important`, opacity 0 hidden / 1 visible. That wrapper is scoped, unlike ContextMenu's injected surface selector. Outside it, this fade rule does not apply. |

No local Escape, roving keyboard navigation, focus trap, arrow geometry or vendor animation-duration override is declared. Do not infer those from the component name. Vendor/caller Tippy behavior and its stylesheet remain separate dependencies, not locally proven browser output.

## Token Mapping

| Concern                         | Token / owner                                                    | Resolved value                                                             |
| ------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Surface radius / border width   | `borderRadius.md` / `borderWidth.DEFAULT`                        | 8px / 1px                                                                  |
| Surface shadow                  | `boxShadow.lg`                                                   | `0 0.125rem 0.063rem rgba(0, 0, 0, 0.05)`                                  |
| Row height / horizontal padding | `spacing.7` / `spacing.5`                                        | 32px / 16px                                                                |
| Group gap / icon                | `spacing.3` / `fontSize.3[0]`                                    | 8px / 16px                                                                 |
| Row typography                  | `fontFamily.sans`, `fontSize.2`                                  | Full stack above; 14px / 1.4 / 0.32px                                      |
| Trigger offset                  | `spacing.4`                                                      | 12px                                                                       |
| Conditional fade                | `transition.DEFAULT`, scoped `GlobalStyles`                      | `all .3s`; not a row transition                                            |
| Colors                          | `contextMenu`, `text`, `select.option`, `divider` theme branches | Full light/dark table above; disabled field is foreground despite its name |

## Recommended Figma Mapping

| Property   | Values                           | Evidence                                    |
| ---------- | -------------------------------- | ------------------------------------------- |
| Theme      | Light / dark                     | Surface and generated row theme values      |
| Visibility | Open / closed                    | Tippy visibility; not a second surface skin |
| Item state | Rest / hover / disabled          | Generated row CSS                           |
| Item icon  | Present / absent                 | Optional `option.icon`                      |
| Divider    | Present / absent in options list | Divider union branch                        |

## Figma Build Notes

- Use a vertical row list with 32px action heights and 16px horizontal row inset; content group gap 8px; optional 16px icon. Do not add an icon reservation or separator margin.
- Apply the menu fill/radius/shadow to the Tippy surface, not to the trigger or row; model the stroke with its stylesheet prerequisite stated above.
- Use the full resolved row text style; the disabled state changes foreground, not opacity. Trigger appearance is consumer-owned.

## Gaps / Assumptions

- Story uses `#reference` and slotted rows although the implementation accepts default trigger + `options`; story is not proof of another API.
- No fixed dimensions for arbitrary trigger content, automatic keyboard menu semantics, or guaranteed label ellipsis in nested flex content are established here.
- Surface stroke style and out-of-scope Tippy appearance/motion require applicable external CSS; no browser measurement was performed. These are evidence limits, not instructions to change runtime code.
