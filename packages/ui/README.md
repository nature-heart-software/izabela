# Izabela UI

Shared Vue components use Panda CSS for styling, Ark UI for overlay and switch
behavior, and semantic native controls where no additional headless primitive is
needed. Element Plus is not required.

## Development

From the workspace root:

```sh
pnpm --filter @packages/ui build
pnpm --filter @packages/ui dev
pnpm --filter @packages/ui storybook
pnpm test:packages -- ui
```

`panda:prepare` generates the ignored `src/styled-system` helpers. Production
builds, Storybook, development startup and the compiled-component test harness
prepare them automatically. The PostCSS integration extracts recipes and
registers source dependencies so development rebuilds include recipe changes.
Component recipes are colocated in `*.panda.ts` files. Shared geometry and
font metrics are mapped from `@packages/design-tokens` in `panda.config.ts`.
Generation runs at those entry points, not during dependency installation:
workspace dependencies must be built before the UI configuration is evaluated.

Applications importing the built package also import its stylesheet:

```ts
import '@packages/ui/dist/style.css'
import { GlobalStyles, NvButton, NvLoading, themes } from '@packages/ui'

app.use(NvLoading)
```

The supported package surface is the root component/helper exports and
`dist/style.css`, not generated styling internals.

## Themes

The existing injected `theme` object remains the theme contract. `GlobalStyles`
and component/portal wrappers map its component-specific color roles to
inheritable `--nv-*` properties. The built-in dark theme supplies defaults;
`themes.get('light')` and custom injected themes remain supported. Primitive
geometry tokens do not replace component-specific color roles.

## Overlay boundaries

- Dialogs provide a reactive `PORTAL_TARGET` containing the parent dialog's
  focus boundary. Descendant interactive overlays use the nearest provided
  portal target rather than escaping to `document.body`.
- Menus, popovers and autocomplete lists keep a viewport-sized transparent
  pointer shield while open. The shield consumes the complete pointer/mouse
  sequence; outside dismissal must not activate an underlying control.
- Nested dismissal applies to the top overlay without dismissing its parent.
  Keep focus restoration and trigger IDs coherent when composing Ark primitives
  with application controls.
- Passive tooltips do not install a pointer-blocking shield.

`Integration/Overlays/Nested` in Storybook exposes nested dialog, popover, menu
and select journeys with an observable underlying-action counter.

## Native control contracts

Text and number inputs expose their native `input` element and preserve existing
model-update payloads. The range input emits numeric updates matching its numeric
model prop and application settings. Switches use Ark's native hidden checkbox for focus,
form participation, disabled/readonly behavior and keyboard Space activation.

`NvLoading` installs `v-loading` and displays a named busy status without turning
pending into native `disabled`. This export is not the former framework's full
loading-service API.

`NvTable` and `NvTableColumn` provide native table/header/cell semantics, data
rows, property columns, scoped row slots, widths, alignment, fixed columns and
row-click callbacks. Element Plus-specific sorting, selection/expand column
types and table instance methods are not a compatibility surface.

The legacy `tippyOptions` prop remains available for existing tooltip/menu call
sites; the wrappers map the positioning/delay/interaction options they support
to Ark. They do not expose a Tippy instance or arbitrary Tippy plugins.

## Verification boundaries

The package test command runs compiled real-component regressions and public
consumer type checks. Native browser regressions use a running Storybook server
and a locally started Chromium browser with a loopback-only debugging port:

```sh
UI_BROWSER_CDP_URL=http://127.0.0.1:9222 pnpm --filter @packages/ui test:browser
```

The runner creates and closes only its own tab. `UI_STORYBOOK_URL` optionally
overrides `http://127.0.0.1:6006`; results and failure screenshots are written to
`coverage/ui-browser`. It fails rather than skipping when its browser/server
prerequisites are unavailable. These journeys check native keyboard input,
generated/computed styles, option hit testing and split down/up gesture
boundaries. Automated checks alone are not a WCAG conformance claim; Windows app
and screen-reader acceptance remain separate from browser/package verification.
