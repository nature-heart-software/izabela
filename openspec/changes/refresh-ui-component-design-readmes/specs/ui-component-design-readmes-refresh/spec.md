## ADDED Requirements

### Requirement: Component design READMEs SHALL capture the full Figma reconstruction surface supported by the code

The system SHALL refresh each component-local design README under `packages/ui/src/components/**` so the document covers the Figma-relevant visual properties supported by the component's source of truth, including layout behavior, typography, fills, strokes, effects, visibility behavior, supporting visuals, and state-specific styling.

#### Scenario: Refreshing a component README with effects and layout details

- **WHEN** a component has source-defined properties such as auto-layout behavior, fills, strokes, focus rings, box shadows, clipping, or part-level export notes
- **THEN** its refreshed README SHALL document those properties in the design-spec sections used for Figma handoff

#### Scenario: Refreshing a simpler component README

- **WHEN** a component does not expose one or more of the expanded property categories
- **THEN** its refreshed README SHALL omit unsupported sections only where appropriate and SHALL explicitly mark unresolved values or unsupported behavior instead of guessing

### Requirement: Refreshed design READMEs SHALL remain component-local and update-safe

The system SHALL update the existing `README.md` file in each target component folder instead of creating a parallel design document location, and the refreshed content SHALL replace stale handoff details rather than duplicating conflicting sections.

#### Scenario: Updating an existing component README

- **WHEN** a component folder already has a design-oriented `README.md`
- **THEN** the refresh SHALL revise that file in place and keep the design documentation grouped in one obvious location

### Requirement: Refreshed design READMEs SHALL include Figma mapping guidance grounded in evidence

Each refreshed README SHALL preserve or add a Figma mapping section that translates the component's implementation into Figma properties and SHALL include concise build notes when layout, effect placement, detached content, or clipping details materially affect reconstruction.

#### Scenario: Documenting a component with part-level build concerns

- **WHEN** a component's Figma recreation depends on where effects belong, which layers use auto layout, or which content should remain detached
- **THEN** the refreshed README SHALL include those build notes alongside the recommended Figma property mapping

#### Scenario: Documenting unresolved build details

- **WHEN** the source does not reveal a Figma-relevant build detail clearly
- **THEN** the README SHALL mark that detail as unresolved instead of presenting a fabricated recommendation
