## 1. Target Inventory

- [x] 1.1 Enumerate the public component targets under `packages/ui/src/components/**` and decide how to handle folders that expose multiple related public components.
- [x] 1.2 Group the component targets into a stable processing order that covers forms, display, feedback, overlay, typography, and miscellaneous components.

## 2. Documentation Generation

- [x] 2.1 Run the `design-system-component-docs` workflow for each targeted component or component family using the implementation, shared props, stories, themes, and tokens as evidence sources.
- [x] 2.2 Write the generated handoff documentation to `README.md` in each owning component folder.
- [x] 2.3 Ensure each generated README includes Figma-relevant sections for component axes, size behavior, theme/state behavior, token mapping, and recommended Figma properties when those details are supported by the source.

## 3. Evidence And Gap Handling

- [x] 3.1 Review generated READMEs to confirm unresolved values, unsupported states, and inherited behavior are marked explicitly instead of inferred.
- [x] 3.2 Review multi-component folders to confirm the README is scoped deliberately to the primary component or component family rather than helper internals.

## 4. Consistency Review

- [x] 4.1 Compare a representative sample of generated READMEs across simple and complex components to verify consistent structure and tone.
- [x] 4.2 Update outlier READMEs so the documentation format is consistent across the `packages/ui` library while still reflecting component-specific behavior accurately.

## 5. Final Validation

- [x] 5.1 Verify that every documented component folder has a local `README.md` and no parallel component-doc location was introduced.
- [x] 5.2 Confirm the generated READMEs can be rerun safely by checking that updates replace stale design-spec content in place rather than duplicating sections.
