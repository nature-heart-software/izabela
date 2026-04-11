---
name: design-system-component-docs
description: Create or update design-system documentation for a code component so it can be recreated accurately in Figma or similar design tools. Use this whenever the user wants a component spec, design handoff doc, Figma-ready variant table, state matrix, token mapping, or asks to document a UI component from source code, stories, theme files, or design tokens, even if they only mention variants, hover states, sizing, borders, or design-system documentation.
---

# Design System Component Docs

Use this skill to turn a component implementation into a design-spec document that a designer or design tool can use reliably.

The goal is not a vague summary. The goal is a precise component document that captures the component's structure, variants, sizes, tokens, visual states, and any theme differences in a form that is easy to export into Figma or another design tool.

## What to inspect

Read the smallest set of files that can establish the component spec with evidence:

- The component implementation (`.vue`, `.tsx`, `.ts`, etc.)
- Shared prop/type files
- Styled/theme files where colors, borders, radius, spacing, and shadows are defined
- Stories, demos, or examples that reveal supported variants and combinations
- Existing design-system documentation in the repo
- Token/theme files when values need to be resolved

If the repo already has a design-system document, update the existing location and style instead of inventing a parallel documentation structure. If the repo has no established place for component docs, create a focused Markdown document in the most obvious design-system docs location.

## Working principles

- Prefer evidence over inference. If a state or value is not represented in code, stories, tokens, or existing docs, mark it as `Not found` instead of guessing.
- Preserve both the token reference and the resolved value when possible, for example `gray.20 (#EBEBEB)`.
- Prefer tables for anything a designer may scan or map into component properties.
- Separate theme-specific values when light and dark differ.
- Separate compound cases when readability would otherwise suffer. A few smaller tables are better than one unreadable mega-table.
- Normalize state names so the document is easy to map into design software: `rest`, `hover`, `focus`, `active`, `selected`, `disabled`, `loading`, `open`, `invalid`, `checked`, `pressed`. Only include states that are actually supported or clearly implied by the implementation.
- Capture booleans and enums as recommended Figma variant properties when that makes the component easier to reconstruct.

If you need an exhaustive checklist for design-tool export details, read `references/figma-export-checklist.md`.

## Extraction workflow

1. Identify the component and locate the authoritative source files.
2. Find any existing documentation that should be updated.
3. Extract the public configuration surface:
   - variants
   - sizes
   - boolean modes
   - slots / children / icons / labels
   - theme dependencies
4. Extract visual rules:
   - typography
   - dimensions
   - padding / gap
   - border radius
   - border width
   - border color
   - background color
   - text color
   - shadow / focus ring
   - opacity / visibility changes
5. Extract interactive states and any compound states, such as `variant + selected` or `size + icon-only`.
6. Translate the implementation into a documentation structure a designer can directly use.
7. Add a short gaps section for anything a designer would need but the code does not define explicitly.

## Output requirements

Prefer this structure unless the repo already has a clearly different house style:

### Component header

- Component name
- Short purpose
- Source files used

### Component axes

Use a table like:

| Property | Kind | Values | Default | Notes |
| -------- | ---- | ------ | ------- | ----- |

This table should include enum props, booleans, and content modes that matter to design, such as icon-only or loading.

### Size specification

Use a table like:

| Size | Height | Min width | Padding X | Padding Y | Gap | Radius | Border width | Typography | Icon size | Notes |
| ---- | ------ | --------- | --------- | --------- | --- | ------ | ------------ | ---------- | --------- | ----- |

If a field is not applicable, use `Not found` or `N/A`.

### Variant and state style tables

Prefer one table per theme when values differ by theme. If needed, split further by variant for readability.

| Theme | Variant | State | Text color | Background color | Border color | Border width | Shadow / focus ring | Radius | Opacity | Notes |
| ----- | ------- | ----- | ---------- | ---------------- | ------------ | ------------ | ------------------- | ------ | ------- | ----- |

Include every evidenced state the implementation supports. If focus is represented as a box shadow instead of a border change, document that exactly.

### Structure / anatomy

Use a table like:

| Part | Source of truth | Visual role | Relevant styling | Export note |
| ---- | --------------- | ----------- | ---------------- | ----------- |

Examples of parts: container, icon, label, helper text, thumb, track, backdrop, caret.

### Token mapping

Use a table like:

| Concern | Token | Resolved value | Where used |
| ------- | ----- | -------------- | ---------- |

### Recommended Figma mapping

Use a table like:

| Figma property | Type | Suggested values | Derived from |
| -------------- | ---- | ---------------- | ------------ |

This should convert the code model into a component-set model, for example:

- `Variant`: `default | plain | ghost | ghost-alt | active`
- `Size`: `xs | sm | md | lg`
- `State`: `rest | hover | focus | active | selected | disabled | loading`
- `Theme`: `light | dark`
- `Icon`: `true | false`
- `Squared`: `true | false`

Only recommend properties that are justified by the implementation. Do not invent a Figma axis for something the code does not meaningfully vary.

### Gaps / assumptions

End with a short table or bullet list covering:

- values that were not directly discoverable
- states missing from code but commonly expected by designers
- ambiguities where implementation and stories disagree
- anything a designer must decide manually

## Update behavior

When updating an existing document:

- preserve surrounding structure and tone
- replace stale values rather than appending contradictory ones
- keep component information grouped in one obvious section

When creating a new document:

- choose a component-specific title
- keep the document focused on design-system export and handoff
- favor Markdown tables over prose blocks

## Quality bar

Before finishing, verify that the document answers these questions without forcing the reader back into the source code:

- What are the supported variants?
- What are the supported sizes and dimensions?
- What visual values change across hover, focus, active, selected, disabled, or other supported states?
- Which values come from tokens versus hard-coded values?
- Which theme differences matter?
- How should this be represented as a Figma component set?

If the answer to any of these is still fuzzy, keep extracting until the document is genuinely useful.
