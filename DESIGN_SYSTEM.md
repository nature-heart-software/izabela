# Izabela Design System

## Overview

Izabela uses a monochromatic, grayscale design system built on two packages:

- **`@packages/design-tokens`** -- raw primitive values (colors, spacing, typography, radii, shadows)
- **`@packages/ui`** -- Vue 3 component library, theme definitions, and CSS-in-JS styled components

The system follows the **Carbon Design System** for spacing and typography scales. Theming is handled via `vue3-styled-components` `<ThemeProvider>` -- no CSS custom properties.

---

## Aesthetic

- **Monochromatic grayscale** -- no brand/accent colors. The palette is black, white, and 11 shades of gray.
- **Light theme**: white backgrounds, dark text (#444444), light gray borders (#EBEBEB). Mostly black and white.
- **Dark theme**: dark gray backgrounds (darkened #444444), light gray text (#DCDCDC), medium gray borders (#444444).
- **Font**: Nunito (sans-serif), weight 600 for interactive elements, 300 for placeholders.
- **Transitions**: `all 0.3s` globally.
- **Shadows**: subtle `0 2px 1px rgba(0,0,0,0.05)`.

---

## Color Palette

| Token      | Hex       | Usage                                            |
| ---------- | --------- | ------------------------------------------------ |
| `white`    | `#ffffff` | Light theme backgrounds                          |
| `black`    | `#0E0E2C` | Dark navy-black, light theme "plain" button fill |
| `gray.100` | `#0E0E2C` | Alias for black                                  |
| `gray.90`  | `#2B2B2C` | Dark theme card backdrop, dialog backdrop        |
| `gray.80`  | `#444444` | Light theme text, dark theme borders             |
| `gray.70`  | `#626262` | Mid-dark gray                                    |
| `gray.60`  | `#818181` | Light theme alt/caption text                     |
| `gray.50`  | `#9F9F9F` | Mid gray                                         |
| `gray.40`  | `#BEBEBE` | Dark theme alt/caption text, placeholders        |
| `gray.30`  | `#DCDCDC` | Dark theme primary text, light borders           |
| `gray.20`  | `#EBEBEB` | Light theme borders                              |
| `gray.10`  | `#F9F9FC` | Light theme hover backgrounds, focus shadows     |
| `gray.0`   | `#ffffff` | Alias for white                                  |

### Light Theme Key Colors

| Role                | Value                         |
| ------------------- | ----------------------------- |
| Text                | `gray.80` (#444444)           |
| Caption text        | `gray.60` (#818181)           |
| Background          | `white` (#ffffff)             |
| Border              | `gray.20` (#EBEBEB)           |
| Hover border        | `gray.30` (#DCDCDC)           |
| Hover background    | `gray.10` (#F9F9FC)           |
| Active background   | `gray.30` (#DCDCDC)           |
| Plain button bg     | `gray.100` (#0E0E2C) -- black |
| Plain button text   | `white` (#ffffff)             |
| Placeholder text    | `gray.40` (#BEBEBE)           |
| Disabled background | `gray.40` (#BEBEBE)           |

### Dark Theme Key Colors

| Role                | Value                                |
| ------------------- | ------------------------------------ |
| Text                | `gray.30` (#DCDCDC)                  |
| Caption text        | `gray.40` (#BEBEBE)                  |
| Background          | `darken(0.0675, gray.80)` (~#333333) |
| Border              | `gray.80` (#444444)                  |
| Hover border        | `gray.70` (#626262)                  |
| Hover background    | `gray.80` (#444444)                  |
| Active background   | `gray.90` (#2B2B2C)                  |
| Plain button bg     | `lighten(0.05, gray.50)` (~#ABABAB)  |
| Plain button text   | `gray.80` (#444444)                  |
| Placeholder text    | `gray.60` (#818181)                  |
| Disabled background | `gray.50` (#9F9F9F)                  |

---

## Sizing

Sizes and spacings share the same unit scale. Interactive elements (buttons, inputs, selects, switches) use four sizes:

| Size | Height | Spacing token |
| ---- | ------ | ------------- |
| `xs` | 16px   | `spacing.5`   |
| `sm` | 24px   | `spacing.6`   |
| `md` | 32px   | `spacing.7`   |
| `lg` | 40px   | `spacing.8`   |

> Buttons support all four sizes (xs, sm, md, lg). Inputs start at `sm`.

When `squared` is set on a button, the width matches the height, producing a square button.

---

## Spacing

Follows the [Carbon Design System spacing scale](https://www.carbondesignsystem.com/guidelines/spacing/overview/):

| Token | px  | rem   |
| ----- | --- | ----- |
| `1`   | 2   | 0.125 |
| `2`   | 4   | 0.25  |
| `3`   | 8   | 0.5   |
| `4`   | 12  | 0.75  |
| `5`   | 16  | 1     |
| `6`   | 24  | 1.5   |
| `7`   | 32  | 2     |
| `8`   | 40  | 2.5   |
| `9`   | 48  | 3     |
| `10`  | 64  | 4     |
| `11`  | 80  | 5     |
| `12`  | 96  | 6     |
| `13`  | 112 | 7     |
| `14`  | 128 | 8     |
| `15`  | 144 | 9     |
| `16`  | 160 | 10    |

### Default Gap

`NvGroup` and `NvStack` both default to `spacing: 3` = **8px**.

### Padding by Size

| Size | Padding  | Spacing token |
| ---- | -------- | ------------- |
| `xs` | 4px all  | `spacing.2`   |
| `sm` | 8px all  | `spacing.3`   |
| `md` | 16px all | `spacing.5`   |
| `lg` | 16px all | `spacing.5`   |

---

## Typography

Font: **Nunito** (loaded via `@font-face`, 16 weight/style variants).

All font sizes use `lineHeight: 1.4` and `letterSpacing: 0.32px`.

| Token | px  | rem   | Usage                            |
| ----- | --- | ----- | -------------------------------- |
| `1`   | 12  | 0.75  | xs/sm/md button text, input text |
| `2`   | 14  | 0.875 | lg button text, lg input text    |
| `3`   | 16  | 1     | Body text                        |
| `4`   | 18  | 1.125 |                                  |
| `5`   | 24  | 1.5   |                                  |
| `6`   | 28  | 1.75  |                                  |
| `7`   | 32  | 2     |                                  |
| `8`   | 36  | 2.25  |                                  |
| `9`   | 42  | 2.625 |                                  |
| `10`  | 48  | 3     |                                  |
| `11`  | 54  | 3.375 |                                  |
| `12`  | 60  | 3.75  |                                  |
| `13`  | 68  | 4.25  |                                  |
| `14`  | 76  | 4.75  |                                  |
| `15`  | 84  | 5.25  |                                  |
| `16`  | 92  | 5.75  |                                  |

---

## Border Radius

| Token     | px  | rem   |
| --------- | --- | ----- |
| `xs`      | 4   | 0.25  |
| `sm`      | 6   | 0.375 |
| `md`      | 8   | 0.5   |
| `DEFAULT` | 8   | 0.5   |

Radius scales with component size:

| Component size | Radius token    |
| -------------- | --------------- |
| `xs`           | `xs` (4px)      |
| `sm`           | `sm` (6px)      |
| `md`           | `md` (8px)      |
| `lg`           | `DEFAULT` (8px) |

---

## Border Width

| Token     | px  |
| --------- | --- |
| `DEFAULT` | 1   |
| `lg`      | 4   |

`DEFAULT` (1px) is used for all component borders. `lg` (4px) is used for focus rings (`box-shadow: 0 0 0 4px <color>`).

---

## Box Shadow

| Token     | Value                           |
| --------- | ------------------------------- |
| `DEFAULT` | `0 2px 1px rgba(0, 0, 0, 0.05)` |
| `lg`      | `0 2px 1px rgba(0, 0, 0, 0.05)` |

> Both are identical -- likely a placeholder for future differentiation.

---

## Components (28 total)

### Forms

| Component        | Sizes          | Notes                                                                                         |
| ---------------- | -------------- | --------------------------------------------------------------------------------------------- |
| `NvButton`       | xs, sm, md, lg | Types: default, plain, ghost, ghost-alt, active. Props: selected, squared, iconName, loading. |
| `NvInput`        | sm, md, lg     | Wraps Element Plus `el-input`.                                                                |
| `NvNumberInput`  | sm, md, lg     | Numeric input.                                                                                |
| `NvTextarea`     | --             | Resizable text area.                                                                          |
| `NvSelect`       | sm, md, lg     | Dropdown select.                                                                              |
| `NvOption`       | --             | Option item for `NvSelect`.                                                                   |
| `NvAutocomplete` | --             | Input with autocomplete suggestions.                                                          |
| `NvSwitch`       | --             | Toggle switch.                                                                                |
| `NvTag`          | --             | Label tag.                                                                                    |
| `NvRangeInput`   | --             | Range slider.                                                                                 |
| `NvFormItem`     | --             | Form field wrapper.                                                                           |

### Layout

| Component   | Default gap | Notes                                                                                                                   |
| ----------- | ----------- | ----------------------------------------------------------------------------------------------------------------------- |
| `NvGroup`   | 8px         | Horizontal flex. Props: justify (left/center/right/apart/around), align, spacing, direction (row/column), noWrap, grow. |
| `NvStack`   | 8px         | Vertical flex. Props: spacing, align, justify.                                                                          |
| `NvCenter`  | --          | Centers content.                                                                                                        |
| `NvDivider` | --          | Horizontal divider line using theme borderColor.                                                                        |

### Display

| Component       | Notes                                                      |
| --------------- | ---------------------------------------------------------- |
| `NvCard`        | Card container with optional transparent/backdrop variant. |
| `NvTable`       | Data table.                                                |
| `NvTableColumn` | Column definition for `NvTable`.                           |

### Typography

| Component | Notes                                                                  |
| --------- | ---------------------------------------------------------------------- |
| `NvText`  | Text display with theme-aware color, captionColor, linkUnderlineColor. |
| `NvIcon`  | Icon display.                                                          |

### Overlay

| Component       | Notes                                     |
| --------------- | ----------------------------------------- |
| `NvDialog`      | Modal dialog with backdrop (95% opacity). |
| `NvPopover`     | Popover.                                  |
| `NvTooltip`     | Tooltip (tippy.js, inverted colors).      |
| `NvContextMenu` | Right-click context menu.                 |

### Feedback

| Component         | Notes                                               |
| ----------------- | --------------------------------------------------- |
| `NvAlert`         | Variants: info (inverted), success, warning, error. |
| `NvAccessBlocker` | Access restriction overlay.                         |

### Virtualization

| Component                | Notes                                           |
| ------------------------ | ----------------------------------------------- |
| `NvVirtualList`          | Virtualized scrolling list (@tanstack/virtual). |
| `NvVirtualListContainer` | Container for virtual list.                     |

---

## Button Variants

| Variant     | Light                                    | Dark                                         |
| ----------- | ---------------------------------------- | -------------------------------------------- |
| `default`   | White bg, dark text, gray border         | Dark gray bg, light text, medium gray border |
| `active`    | Same as default + thicker (2px) border   | Same as default + thicker border             |
| `plain`     | Black bg, white text (inverted)          | Light gray bg, dark text                     |
| `ghost`     | Transparent bg + border, dark text       | Transparent bg + border, light text          |
| `ghost-alt` | Same as ghost, selected adds shadow + bg | Same as ghost, selected adds shadow + bg     |

---

## Theme Structure

Each theme (`light` and `dark`) exports the same object shape. Themes are stored in a `Map<'light' | 'dark'>` and injected via `<ThemeProvider>`.

```
theme
  button
    default    { color, backgroundColor, borderColor, disabled, hover, selected, active, focus, readonly }
    active     { ...same }
    ghost      { ...same, transparent bg/border }
    ghost-alt  { ...same, transparent bg/border, selected has boxShadow }
    plain      { color, backgroundColor, borderColor, hover, active, focus, selected }
  card         { backgroundColor, transparent: { backdropColor, backdropOpacity } }
  alert        { info, success, warning, error: { backgroundColor, color } }
  autocomplete { backgroundColor, borderColor }
  input        { borderColor, color, backgroundColor, hover, focus, placeholder }
  numberInput  { ...same as input }
  switch       { backgroundColor, borderColor, thumbColor, activeThumbColor, hover, focus }
  tag          { backgroundColor, borderColor }
  select       { ...same as input, option: { ...same as button } }
  rangeInput   { trackColor, thumbColor, thumbHoverColor, thumbActiveColor, thumbFocusBoxShadow, thumbFocusBorderColor }
  divider      { borderColor }
  text         { color, captionColor, linkUnderlineColor }
  tooltip      { backgroundColor, borderColor, color } -- inverted (plain button colors)
  popover      { backgroundColor, borderColor }
  contextMenu  { backgroundColor, borderColor }
  dialog       { backdropColor, backdropOpacity, contentBackgroundColor }
  disabledItemBackground { backdropColor, backdropOpacity }
```

---

## Architecture Notes

- **CSS-in-JS**: All component styling uses `vue3-styled-components`. Theme values are accessed via `${({ theme }) => theme.x.y}`.
- **No CSS custom properties for theming**: themes are JS objects, not `:root` variables.
- **Tailwind coexists**: used for utility classes in templates alongside styled components. Both consume the same design tokens.
- **`polished` library**: provides `darken()`, `lighten()`, `rem()`, `rgba()` for runtime color manipulation.
- **Element Plus**: used as the underlying input system (`el-input`, `el-select`, etc.), restyled via the CSS-in-JS wrappers.
