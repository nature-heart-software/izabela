## Context

`packages/ui` already contains component-local design READMEs for many components, but those documents were written against an earlier version of the `design-system-component-docs` skill. As a result, some READMEs under-document Figma reconstruction details such as auto-layout behavior, layered fills, stroke details, effect placement, clipping, and explicit build notes for how a component should be modeled in Figma.

This refresh touches many component folders, but it is still a documentation-only change. The work needs to update existing READMEs in place, preserve component-local ownership, and stay grounded in the implementation, stories, themes, and tokens rather than inventing missing behavior.

## Goals / Non-Goals

**Goals:**

- Refresh existing `packages/ui/src/components/**/README.md` files so they reflect the expanded Figma-oriented output contract of the updated skill.
- Ensure the refreshed READMEs document the broader visual surface that matters for Figma recreation, including layout, fills, strokes, effects, part-level styling, and build notes when supported by source evidence.
- Keep the docs update-safe by revising the existing README in each component folder instead of creating parallel documentation files.
- Preserve explicit gap handling so unresolved values remain marked as `Not found`, `Unsupported`, or similar evidence-based language.

**Non-Goals:**

- Changing runtime component behavior, props, styling, or tokens in `packages/ui`
- Replacing component-local READMEs with a centralized design document
- Forcing every README into identical table density when some components are intentionally simpler
- Inferring missing design behavior that is not supported by component code, stories, or theme/token sources

## Decisions

### 1. Refresh docs in place

The implementation should update the existing `README.md` file in each component folder rather than generating a second document or appending a parallel section.

Why this approach:

- It preserves the current ownership model where the handoff doc lives next to the component source.
- It avoids conflicting sources of truth for designers and developers.
- It makes future refreshes repeatable with the same skill-driven workflow.

Alternatives considered:

- Create new design-doc files alongside the existing READMEs: rejected because it would fragment the handoff surface.
- Centralize all refresh output in a package-level doc: rejected because it weakens local discoverability and maintainability.

### 2. Treat the updated skill as the documentation contract

The refreshed READMEs should be regenerated or revised according to the current `design-system-component-docs` skill, especially its expanded guidance around Figma primitives such as auto layout, fills, strokes, effects, clipping, and build notes.

Why this approach:

- The skill now defines the broader set of properties that designers need for faithful Figma reconstruction.
- Reusing the skill keeps structure and terminology consistent across many components.
- It makes the refresh measurable against a shared contract rather than ad hoc editorial preference.

Alternatives considered:

- Patch each README manually without reference to the skill: rejected because the resulting docs would drift in structure and completeness.
- Introduce a custom documentation template just for this refresh: rejected because it would duplicate the skill's role.

### 3. Preserve evidence-first gaps instead of synthetic completeness

When the source does not clearly define a value such as effect placement, clipping, or part-specific behavior, the refreshed README should say so explicitly instead of filling in likely defaults.

Why this approach:

- The goal of these docs is reliable handoff, not speculative polish.
- The updated skill already encodes this expectation and the refresh should not regress it.
- Clear gaps are more useful to design review than incorrect certainty.

Alternatives considered:

- Fill in commonly expected values for missing states or effects: rejected because it would misrepresent the source of truth.

### 4. Review simple and complex components against the same Figma-oriented bar

Interactive components such as buttons and inputs will naturally have richer state and effect coverage than static or rest-only components, but all refreshed READMEs should still be checked for the newly expected property categories.

Why this approach:

- The missing details are not limited to one component class.
- A consistent review bar helps catch older READMEs that still omit effects or build notes.
- Simpler components can still document the absence of certain properties cleanly.

Alternatives considered:

- Only refresh form components: rejected because the user asked to update all relevant UI design documents in the READMEs.

## Risks / Trade-offs

- [Bulk README updates could overwrite useful wording from the first pass] -> Mitigation: update in place carefully and preserve accurate component-specific notes that still fit the newer skill contract.
- [Some components may still lack evidence for newly emphasized Figma properties] -> Mitigation: require explicit `Not found` or equivalent gap language instead of forcing fabricated detail.
- [The expanded skill may make simple READMEs longer] -> Mitigation: keep sections concise and only add fields that are supported or useful for reconstruction.
- [Consistency may drift across dozens of component folders] -> Mitigation: review a representative mix of interactive, structural, and feedback components before considering the refresh complete.

## Migration Plan

1. Enumerate the component-local design READMEs under `packages/ui/src/components/**`.
2. Re-run the `design-system-component-docs` workflow for each target component or component family using the updated skill contract.
3. Update each existing `README.md` in place so it captures any newly required Figma-oriented properties and build notes.
4. Review a representative sample across component categories to confirm the refreshed docs consistently cover layout, fills, strokes, effects, and explicit gaps.
5. Treat the refreshed READMEs as the new baseline for future skill-driven updates.

Rollback strategy:

- Revert the modified README files if the refresh introduces inaccuracies or unacceptable churn.

## Open Questions

- Should the refresh also add a short package-level note explaining that component READMEs are the authoritative design handoff surface, or is folder-local documentation sufficient on its own?
- For folders that document a component family, should the refreshed README keep one shared spec or split into more explicit sub-sections when the updated skill surfaces materially different anatomy or effect behavior?
