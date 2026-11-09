# Figma-owned design tokens

Figma variable names are the token contract. The application consumes the same hierarchy: `button/default/pressed/background` becomes `button.default.pressed.background` in Panda, not an independently named application role. Values, aliases, collection modes, and source IDs are retained in `figma/variables.json`; `src/figma.generated.json` is generated from that input.

## Import an update

Export the file's complete local variables as JSON, then run from the repository root:

```sh
pnpm tokens:import /path/to/variables.json
pnpm tokens:check
pnpm test:packages design-tokens ui
```

The importer accepts either:

- A Figma local-variables REST response (`meta.variableCollections` and `meta.variables`).
- A plugin export with `collections` and `variables` arrays. Collection records contain `id`, `name`, `defaultModeId`, `modes`, and `variableIds`. Variable records contain `id`, `name`, `variableCollectionId`, `resolvedType`, and `valuesByMode`.

For accounts with access to Figma's Variables REST API, an export can be downloaded without placing a credential in a repository file:

```sh
curl --fail --silent --show-error \
  -H "X-Figma-Token: $FIGMA_ACCESS_TOKEN" \
  'https://api.figma.com/v1/files/t75cp3VfHE0GBmnFJYOVZ8/variables/local' \
  --output variables.json
```

Alternatively, `tools/figma-export.js` can run as a read-only Figma development plugin script. It opens a download button for the same JSON format and does not modify the design. Keep exported files outside the checkout until importing them.

The importer validates the complete input before writing. Missing mode values, missing/cyclic aliases, duplicate identities, unsafe or colliding paths, and invalid scalar/color values fail the import. `tokens:check` is read-only and fails when checked-in generation drifts. The package regression suite executes both the importer behavior tests and this drift check on Linux and Windows.

## Collections and modes

- **Tokens** supplies primitive values with its authored paths: `radius`, `border`, scalar `fontSize`, `lineHeight`, and `letterSpacing`, for example. Panda categories convert dimensions to CSS units without retaining the former token namespaces.
- **Colors** supplies palette values and independent Light/Dark selections. Palette groups, including `Cloudflare Kumo` and `Kumo`, keep their exact spelling in the imported object. Panda rejects spaces in named token keys, so these groups are exposed as scoped CSS custom properties rather than renamed Panda palette keys. Components consume the exact Figma semantic roles through Panda.
- **Semantic Tokens** supplies the component/shared roles and the application theme-mode inventory. Every mode automatically appears in settings and the Storybook toolbar. There is no two-theme allowlist or theme-specific value adapter.
- **Figma** contains design/preview-only helpers and is excluded from production imports.

Mode IDs are collection-local; array positions must never be zipped together. For each semantic mode, other collections select an exact matching mode name, a matching trailing name (`GitHub Dark` → `Colors/Dark`), or their authored default. An export can explicitly select an independent collection mode when the semantic label does not express that relationship:

```json
{
  "collections": [],
  "variables": [],
  "collectionModes": {
    "Future Moon": { "Colors": "Dark" }
  }
}
```

The arrays above illustrate only the additional configuration field; a real export must contain its complete collections and variables. This configuration is data, not an application theme implementation.

## Runtime and compatibility

`themeOptions`, `themes`, and `resolveTheme` are derived from the generated inventory. Existing persisted `light`/`dark` preferences resolve to the Izabela modes; unknown selections fall back to the authored default semantic mode. Themes switch reactively without requesting an application restart. A `ThemeProvider` owns a scoped CSS-variable boundary, including semantic aliases, so nested providers and portal descendants use their selected theme rather than a root-cached color.

Colors with alpha retain the authored alpha value. Semantic shadow-color roles are also exposed in Panda's `shadows` category under the same path, combined with the authored `shadow/offsetY`, `shadow/blur`, and `shadow/spread` geometry.

Changing existing values or adding theme modes needs only export, import, and rebuild—not component edits. Renaming/removing a role consumed by the application is a token-contract change: update its consumers to the new Figma path rather than keeping stale legacy aliases. Adding new visual behavior or controls still requires implementation; importing a variable does not invent a UI that consumes it.
