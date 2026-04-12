## Why

The `packages/ui` component READMEs were created before the `design-system-component-docs` skill was expanded to capture Figma-relevant properties like fills, strokes, effects, layout behavior, and build notes. Refreshing those docs now keeps the design handoff material aligned with the newer skill so designers do not have to reopen source files to recover missing visual details.

## What Changes

- Update the existing component-local design `README.md` files under `packages/ui/src/components/**` using the current `design-system-component-docs` skill.
- Normalize the refreshed READMEs so they cover the broader Figma reconstruction surface, including layout behavior, fills, strokes, effects such as box shadow or focus rings, and part-level export notes where supported by the code.
- Preserve evidence-first documentation behavior by marking unresolved values and unsupported states explicitly instead of inferring them.
- Review the refreshed docs for consistency so older README structure or wording does not leave out newly required Figma details.

## Capabilities

### New Capabilities
- `ui-component-design-readmes-refresh`: Refresh and maintain component-local `packages/ui` design READMEs so they match the current Figma-oriented documentation contract defined by the `design-system-component-docs` skill.

### Modified Capabilities
- None.

## Impact

- Affected code: `packages/ui/src/components/**/README.md`
- Affected docs/tooling: `.agents/skills/design-system-component-docs` and the workflow used to maintain UI design handoff docs
- Affected systems: design-to-code handoff for the shared UI component library
