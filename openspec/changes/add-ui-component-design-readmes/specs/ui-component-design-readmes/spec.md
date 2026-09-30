## ADDED Requirements

### Requirement: Component folders SHALL have local design-system readmes

The system SHALL create and maintain a `README.md` in each documented `packages/ui` component folder so the design handoff specification lives adjacent to the component implementation.

#### Scenario: Creating a README for a component folder without one

- **WHEN** the documentation workflow processes a component folder under `packages/ui/src/components/**` that does not yet contain a `README.md`
- **THEN** it creates a new `README.md` in that same folder

#### Scenario: Updating an existing component README

- **WHEN** the documentation workflow processes a component folder that already contains a `README.md`
- **THEN** it updates the design-system documentation in that file instead of creating a parallel documentation file elsewhere

### Requirement: Readmes SHALL document Figma-relevant component behavior

Each generated component README SHALL capture the component behavior that a design tool or designer would need in order to reconstruct the component accurately, including component axes, supported sizes, supported states, token or resolved values when available, and recommended Figma mapping.

#### Scenario: Documenting an interactive component

- **WHEN** the workflow processes a component that exposes visual variants, sizes, or interactive states in source code, stories, or theme files
- **THEN** the README includes tables describing those variants, sizes, themes, states, and Figma-facing properties

#### Scenario: Documenting a simpler structural component

- **WHEN** the workflow processes a component that has limited or no interactive state behavior
- **THEN** the README still documents the component anatomy, layout or size behavior, and any Figma mapping that is supported by the implementation

### Requirement: Readmes SHALL be evidence-based

Generated documentation SHALL derive values from the component implementation, shared prop definitions, story files, theme files, and design-token sources, and SHALL not invent unsupported states or unresolved values.

#### Scenario: Values are available in code or theme sources

- **WHEN** a component's styling values or state behavior can be resolved from source files or token/theme definitions
- **THEN** the README records those values or token mappings in the design-system documentation

#### Scenario: Values are not available in source material

- **WHEN** the workflow cannot verify a dimension, token, state, or style value from the available source material
- **THEN** the README explicitly marks that information as unresolved, unsupported, or not found instead of guessing a value

### Requirement: Multi-component folders SHALL be documented deliberately

When a folder exposes multiple related public components, the documentation workflow SHALL produce a folder README that is centered on the primary component or clearly scoped component family rather than blindly mixing unrelated internals.

#### Scenario: Folder contains a primary component and related exports

- **WHEN** a component folder contains a primary public component and one or more supporting public components
- **THEN** the README documents the primary component or component family intentionally and identifies related exports only where they are relevant to the design handoff

#### Scenario: Folder contains helper or implementation-only files

- **WHEN** a component folder contains style helpers, shared prop files, or other internal implementation files
- **THEN** the README describes the exported component behavior rather than treating those helper files as standalone documented components

### Requirement: The documentation workflow SHALL be repeatable

The component README generation process SHALL be safe to rerun as the UI library evolves, so that refreshed documentation replaces stale handoff details without requiring a new documentation structure.

#### Scenario: Regenerating docs after component changes

- **WHEN** the documentation workflow is rerun for a component whose props, states, tokens, or theme mappings have changed
- **THEN** the existing `README.md` is refreshed to reflect the new behavior in the same component folder

#### Scenario: Reviewing generated docs across the component library

- **WHEN** the documentation workflow is run across multiple `packages/ui` component folders
- **THEN** the resulting READMEs follow a consistent component-doc structure that supports review and maintenance across the library
