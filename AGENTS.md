# Figma and code must stay in sync

Figma is the source of truth for this application's visual design. Keeping Figma and code aligned is mandatory, without exceptions.

- Before changing any visual treatment, inspect the corresponding Figma component, state, variables, and bindings. The design-token source file is `t75cp3VfHE0GBmnFJYOVZ8`.
- Update and validate Figma first when the requested appearance is missing or needs to change. Then implement the same design in code. Never introduce an app-only visual override, hardcoded replacement, temporary workaround, or new variant that Figma does not define.
- Keep affected components, interaction states, themes, semantic variables, and geometry consistent in both representations. Reusing an existing Figma color alone does not make a new styling rule synchronized.
- Export changed variables from the live Figma file and import them with the repository's `pnpm tokens:import` workflow. Do not manually invent or edit the exported snapshot or generated token values to simulate a Figma update.
- Before completing a visual change, run `pnpm tokens:check`, the relevant regression checks, and compare the affected Figma states with the running application. Resolve any drift before committing, pushing, or reporting completion.
- If Figma cannot be accessed, edited, or verified, stop the dependent visual implementation and explain the blocker. Do not substitute a code-only fix or leave a newly introduced visual override in place.

See `packages/design-tokens/README.md` for the token export and import contract.
