## Why

The `packages/ui` components do not currently have component-local design handoff documentation that captures variants, sizes, tokens, and state styling in a format designers can map into Figma. Adding consistent `README.md` files for each component makes the UI library easier to maintain, easier to review, and easier to keep aligned between code and design.

## What Changes

- Generate design-system documentation for each component under `packages/ui` using the `design-system-component-docs` skill.
- Save the generated documentation as a `README.md` in each component folder so the spec lives next to the source of truth.
- Standardize the output around Figma-ready tables for component axes, size rules, token mapping, theme differences, and supported interaction states.
- Define expectations for how unsupported or unresolved states should be documented so the generated docs do not invent missing behavior.

## Capabilities

### New Capabilities

- `ui-component-design-readmes`: Generate and maintain component-local design-system documentation for `packages/ui` components, including Figma-oriented tables for variants, sizing, theming, tokens, and interaction states.

### Modified Capabilities

- None.

## Impact

- Affected code: `packages/ui/**`, especially component folders that will gain `README.md` documentation.
- Affected docs/tooling: `.agents/skills/design-system-component-docs`, OpenSpec change artifacts for this workflow, and repo-level design-system documentation practices.
- Affected systems: developer and designer handoff workflow for the UI component library.
