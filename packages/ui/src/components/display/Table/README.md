# NvTable / NvTableColumn Design Spec

Purpose: thin display wrappers around Element Plus `ElTable` and `ElTableColumn` that forward attrs and named slots without adding local design-system styling.

## Source Files Used

| File                | Purpose                                                                                              |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `NvTable.vue`       | Local wrapper structure, component name, slot forwarding, and imported Element Plus table CSS        |
| `NvTableColumn.vue` | Local wrapper structure, component name, slot forwarding, and imported Element Plus table-column CSS |
| `table.stories.ts`  | Storybook evidence for default family usage with table data and three columns                        |

## Family Overview

| Component       | Role              | Local implementation summary                                                                             |
| --------------- | ----------------- | -------------------------------------------------------------------------------------------------------- |
| `NvTable`       | Table container   | Wraps `ElTable`, forwards all `$attrs`, forwards all slots, imports Element Plus table CSS.              |
| `NvTableColumn` | Column definition | Wraps `ElTableColumn`, forwards all `$attrs`, forwards all slots, imports Element Plus table-column CSS. |

## Component Axes

| Property              | Kind                  | Values                                              | Default                       | Notes                                                                               |
| --------------------- | --------------------- | --------------------------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------- |
| `NvTable` props       | inherited props       | `InstanceType<typeof ElTable>['$props']`            | Inherited from Element Plus   | No local prop filtering or local defaults are defined.                              |
| `NvTableColumn` props | inherited props       | `InstanceType<typeof ElTableColumn>['$props']`      | Inherited from Element Plus   | No local prop filtering or local defaults are defined.                              |
| slots                 | forwarded named slots | Any slot accepted by wrapped Element Plus component | Inherited from consumer usage | Both wrappers iterate over `$slots` and forward each slot with scope.               |
| `theme`               | contextual            | Not found in local source                           | Not found                     | These wrappers do not read theme tokens directly.                                   |
| local variants        | enum / boolean axes   | Unsupported                                         | Unsupported                   | No local variant, size, density, tone, selection, or emphasis prop is defined here. |

## Size Specification

| Size            | Height                          | Min width                       | Padding X                       | Padding Y                       | Gap                             | Radius                          | Border width                    | Typography                      | Icon size | Notes                                          |
| --------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | ------------------------------- | --------- | ---------------------------------------------- |
| `NvTable`       | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | N/A       | No local size system exists in wrapper source. |
| `NvTableColumn` | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | Inherited from Element Plus CSS | N/A       | Columns do not add local size rules.           |

## Variant And State Styles

| Theme     | Variant                     | State                       | Text color                  | Icon color   | Background / fill           | Border / stroke                                           | Shadow / effects            | Radius                      | Opacity                     | Notes                                                                      |
| --------- | --------------------------- | --------------------------- | --------------------------- | ------------ | --------------------------- | --------------------------------------------------------- | --------------------------- | --------------------------- | --------------------------- | -------------------------------------------------------------------------- |
| Not found | Inherited from Element Plus | Inherited from Element Plus | Inherited from Element Plus | same as text | Inherited from Element Plus | Inherited from Element Plus / Inherited from Element Plus | Inherited from Element Plus | Inherited from Element Plus | Inherited from Element Plus | Local source imports Element Plus CSS and adds no overriding visual rules. |

## Structure / Anatomy

| Part                            | Source of truth                                                                      | Visual role                                               | Relevant styling                                                | Export note                                                       |
| ------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------- |
| `NvTable` wrapper root          | `<component v-bind:is="'wrapped-component'" v-bind="$attrs">` in `NvTable.vue`       | Host for the Element Plus table instance                  | No local style block; uses imported Element Plus CSS            | Treat as a pass-through shell around the vendor table component.  |
| `NvTable` forwarded slots       | `v-for="(_, slot) of $slots"` in `NvTable.vue`                                       | Forwards header, default, and other supported named slots | No local visual styling                                         | Slot anatomy is inherited from the wrapped component contract.    |
| `NvTableColumn` wrapper root    | `<component v-bind:is="'wrapped-component'" v-bind="$attrs">` in `NvTableColumn.vue` | Host for the Element Plus column instance                 | No local style block; uses imported Element Plus CSS            | Treat as a pass-through shell around the vendor column component. |
| `NvTableColumn` forwarded slots | `v-for="(_, slot) of $slots"` in `NvTableColumn.vue`                                 | Forwards scoped column slots                              | No local visual styling                                         | Slot anatomy is inherited from the wrapped component contract.    |
| story example columns           | `table.stories.ts`                                                                   | Evidence of common usage                                  | `date` width `180`, `name` width `180`, `address` fixed `right` | Example only; not a component-level default.                      |

## Token Mapping

| Concern               | Token                   | Resolved value              | Where used                                                                                             |
| --------------------- | ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------ |
| Local design tokens   | Unsupported             | Not found                   | No local token imports or theme reads exist in the wrapper files.                                      |
| Visual styling source | Element Plus CSS import | Imported vendor stylesheets | `element-plus/lib/components/table/style/css` and `element-plus/lib/components/table-column/style/css` |

## Recommended Figma Mapping

| Figma property   | Type             | Suggested values           | Derived from                                            |
| ---------------- | ---------------- | -------------------------- | ------------------------------------------------------- |
| `Component`      | component family | `NvTable`, `NvTableColumn` | Two separate wrappers documented in one folder README   |
| `Columns`        | nested instances | freeform                   | `NvTable` composes one or more `NvTableColumn` children |
| `Vendor styling` | annotation       | `Element Plus defaults`    | Imported Element Plus CSS and inherited prop surface    |

## Figma Build Notes

- Use the primary visible part named in `Structure / Anatomy` as the main Figma frame, and keep purely behavioral wrappers such as hidden inputs, triggers, portals, or state containers outside the exported component set.
- Apply fills, strokes, radius, and effects to the same layer identified in the anatomy table instead of redistributing those values across extra wrapper frames.
- Keep slot content, consumer-provided copy, and arbitrary child content detached unless the README already defines them as explicit Figma properties.
- If clipping, effect placement, or delegated styling is unresolved in source, preserve that uncertainty in the notes instead of inventing extra Figma variants.

## Gaps / Assumptions

| Item                                                                                           | Status                                                                                                                                                |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Concrete prop matrix for `NvTable` and `NvTableColumn`                                         | Not enumerated locally. Public API is inherited from Element Plus types, which are referenced but not restated in these files.                        |
| Local variants, sizes, density, selection, hover, focus, sorting, pagination, and empty states | Not found in local source. These behaviors, if available, come from Element Plus rather than this folder.                                             |
| Token-based color, border, spacing, or typography mapping                                      | Unsupported locally. No token or theme module is consumed here.                                                                                       |
| Theme differences                                                                              | Not found in local wrapper source. Any theming comes from Element Plus styling or higher-level application CSS.                                       |
| Storybook coverage                                                                             | Only one basic story is present, showing a data table with three columns. It is example usage, not an exhaustive design spec for all vendor features. |
