## Context

`packages/ui` contains a broad set of reusable Vue components spread across multiple domains such as forms, display, feedback, overlay, typography, and miscellaneous layout helpers. Today those components do not have component-local design handoff documents, which means designers and developers have to reconstruct variant axes, token usage, and interactive state behavior directly from source files, stories, and theme definitions.

This change needs to operate across many component folders rather than a single isolated module. It also needs to produce docs that are useful for Figma reconstruction without inventing unsupported states or values. The recently added `design-system-component-docs` skill already defines the target output shape, including tables for component axes, sizes, themes, tokens, and Figma mapping, so this design focuses on how to apply that skill consistently across the full `packages/ui` component set.

Constraints:

- Documentation should live next to the source component so it stays discoverable and maintainable.
- Existing source files, stories, and theme/token files are the authority; generated docs should not guess missing values.
- Some folders contain multiple related components, such as `NvSelect` and `NvOption`, or table/container pairs, so the process must treat each component deliberately rather than assuming one folder always equals one component.
- There are currently no `README.md` files under `packages/ui/src/components`, so the first run is primarily additive rather than update-in-place.

## Goals / Non-Goals

**Goals:**

- Define a repeatable approach for generating `README.md` files for each documented `packages/ui` component.
- Keep each generated document focused on design-system export and Figma-ready handoff details such as variants, sizes, theme differences, token mappings, and supported states.
- Make the generation process safe for incomplete components by requiring unresolved values and unsupported states to be documented explicitly rather than inferred.
- Standardize where the documentation is written so every component folder has a predictable documentation location.
- Preserve the ability to rerun the workflow later to refresh component docs as implementation details evolve.

**Non-Goals:**

- Redesigning component APIs or changing runtime behavior in `packages/ui`.
- Creating a single monolithic design-system document for all components.
- Guaranteeing that every component supports the same documentation sections when the code does not expose the necessary data.
- Introducing a new parser, AST pipeline, or external documentation dependency beyond the existing skill-driven workflow.

## Decisions

### 1. Write one `README.md` per component folder

The documentation will be stored as `README.md` in the folder that owns the component source. This keeps the handoff spec adjacent to the implementation and avoids creating a second documentation hierarchy that can drift.

Why this approach:

- Component-local docs are easier to discover while editing the component.
- The folder is already the natural aggregation point for the implementation, shared prop files, stories, and style/theme adapters.
- It supports incremental updates later without touching unrelated components.

Alternatives considered:

- Centralizing all component docs in a single repo-level Markdown file: rejected because it becomes hard to navigate and harder to keep synchronized with individual components.
- Writing docs under a parallel `docs/components/` tree: rejected because it duplicates the component structure and weakens local ownership.

### 2. Treat each Vue component entrypoint as an explicit documentation target

The generation scope should be driven by actual component entrypoints such as `NvButton.vue`, `NvInput.vue`, `NvAlert.vue`, and similar files under `packages/ui/src/components/**`. Multi-component folders should be processed intentionally, with one resulting folder README reflecting the primary component or component family in that folder.

Why this approach:

- It aligns the documentation workflow with the real public component surface.
- It avoids accidentally documenting helper-only files that are not meaningful design-system primitives.
- It gives the generation pass a deterministic traversal strategy.

Alternatives considered:

- Documenting every folder blindly: rejected because some folders may contain helper files or multiple related primitives that need human grouping.
- Documenting every file in the folder, including shared/style/token helpers: rejected because the output should describe the exported component behavior, not the internal file inventory.

### 3. Use the `design-system-component-docs` skill as the generation contract

The existing skill defines the expected output structure and the evidence rules for extracting data from implementation, stories, themes, and tokens. The change should rely on that skill instead of inventing a new ad hoc prompt for each component.

Why this approach:

- The skill already encodes the key output sections: component axes, size tables, state/theme tables, anatomy, token mappings, Figma mapping, and gaps.
- It creates a consistent documentation format across many components.
- It reduces per-component prompt drift and makes reruns more predictable.

Alternatives considered:

- Manually prompting per component: rejected because output quality and structure would vary too much across dozens of components.
- Building a codegen script first: rejected for now because the underlying task still requires judgment across stories, theme files, and unsupported-state handling.

### 4. Prefer explicit gaps over inferred behavior

When a component does not expose a state, token, or dimension clearly in code or stories, the generated README should say `Not found`, `Unsupported`, or equivalent language rather than inventing a likely value.

Why this approach:

- The purpose of the docs is reliable handoff, not synthetic completeness.
- Designers need to know where code is authoritative versus where a manual decision is still required.
- This matches the safety constraints in the skill and avoids encoding false requirements into the design system.

Alternatives considered:

- Filling in common defaults such as disabled or focus states when absent: rejected because it would turn documentation into speculation.

### 5. Make the workflow additive-first but update-safe

The first run can assume most component folders do not already contain a `README.md`, but the design should still treat later reruns as updates rather than append-only generation. The generation pass should replace stale design-spec content in the README rather than duplicating conflicting sections.

Why this approach:

- The current repo state is additive, but the long-term maintenance model requires reruns.
- An update-safe approach keeps the workflow reusable after future UI changes.

Alternatives considered:

- Treating this as one-time generated output: rejected because component APIs and styling will evolve.

## Risks / Trade-offs

- [Folders with multiple public components may not map cleanly to a single README] -> Mitigation: document the primary public component or component family intentionally and call out related exported primitives where needed.
- [Some components may rely heavily on external library internals such as Element Plus DOM structure] -> Mitigation: document wrapper-owned behavior precisely and mark inherited/internal behavior as unresolved when the repo source does not define it clearly.
- [Bulk-generated docs may vary in depth depending on component complexity] -> Mitigation: enforce the common skill structure and use explicit gaps sections so shorter docs are still complete about what is and is not known.
- [Reruns could overwrite manual edits if the README becomes mixed-purpose] -> Mitigation: keep the README focused on component design-system documentation and treat it as generated/maintained handoff content rather than a general notes file.
- [The number of components makes the task time-consuming and potentially inconsistent if done casually] -> Mitigation: use the skill systematically across the component set and validate outputs against the documented capability requirements before considering the change complete.

## Migration Plan

1. Enumerate the component targets under `packages/ui/src/components/**`.
2. Run the documentation workflow for each target component or component family.
3. Write the generated handoff doc to `README.md` in the owning component folder.
4. Review a representative subset for consistency and accuracy, especially components with complex state or theme behavior.
5. Iterate on any outliers, then treat the folder-local READMEs as the new baseline for future updates.

Rollback strategy:

- Because this change is documentation-only, rollback is simply removing or reverting the generated `README.md` files if the output is not acceptable.

## Open Questions

- For folders that expose multiple public components, should one shared README document the full family, or should the generation process create a README centered on the primary component and list the related exports separately?
- Should lightweight structural primitives such as layout helpers receive the same full Figma-oriented treatment as highly interactive form components, or should the generated docs allow a slimmer shape for non-interactive components?
