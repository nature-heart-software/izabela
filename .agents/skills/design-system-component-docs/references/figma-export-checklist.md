# Figma Export Checklist

Use this checklist when the component is interactive or visually rich and the first pass risks missing important design-hand-off details.

## Identity

- Component name
- Purpose
- Source files reviewed
- Existing docs updated or created

## Variant axes

- Variant enum props
- Size enum props
- Boolean flags that change visuals
- Content modes: text-only, icon-leading, icon-only, loading, selected, checked, open
- Theme axis if light and dark differ materially

## Visual properties to capture

### Layout and sizing

- Width / min-width / max-width
- Height / min-height / max-height
- Padding / gap / alignment / justification
- Auto-layout direction and wrapping when evidenced
- Overflow / clipping / mask behavior when evidenced

### Typography

- Font family
- Font size
- Font weight
- Line height
- Letter spacing
- Text transform
- Text decoration

### Fills, strokes, and colors

- Background color or layered fills
- Gradient fills if present
- Border / stroke width
- Border / stroke color
- Border / stroke style
- Stroke alignment if discernible
- Text color
- Icon color
- Placeholder / helper / caret color where relevant

### Shape and effects

- Corner radius, including per-corner differences
- Box shadow
- Inset shadow
- Focus ring / outline
- Blur / backdrop blur
- Opacity
- Backdrop color / opacity for overlays

### Part-level supporting visuals

- Icon size
- Avatar / media size
- Divider thickness
- Decorative layers or surfaces

## State coverage

Capture any state that is explicitly styled or logically exported:

- rest
- hover
- focus
- active / pressed
- selected
- disabled
- loading
- invalid
- checked / unchecked
- open / closed

## Anatomy

- Container
- Label / text
- Icon
- Caret / chevron
- Thumb / track
- Helper text
- Backdrop / overlay
- Decorative layers

## Figma mapping hints

- Prefer enum props as component-set variant properties.
- Prefer booleans for toggles such as `Icon`, `Loading`, `Selected`, `Disabled`.
- Use a `State` property when the same component has multiple styled interaction states.
- Use a `Theme` property only if the team wants one shared component set across themes; otherwise document light and dark separately.
- If code supports compound states, document whether Figma should model them as separate values or as combined properties.
- Document which layers should use Auto Layout versus fixed sizing.
- Document where effects belong: root container, nested surface, icon, label, or overlay.
- Keep non-variant visual details such as fill, stroke, radius, shadow, and clipping in the spec even when they should not become component properties.

## Missing data handling

- Do not guess values hidden behind runtime behavior you cannot verify.
- Mark unresolved values as `Not found`.
- Call out states designers may still want even if code does not expose them.
