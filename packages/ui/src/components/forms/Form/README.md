# NvFormItem

Simple field wrapper that pairs an optional label with slotted field content using vertical stack spacing.

## Source Files Used

- `NvFormItem.vue`
- `@packages/design-tokens/src/main.ts`

## Component Axes

| Property     | Kind   | Values        | Default | Notes                             |
| ------------ | ------ | ------------- | ------- | --------------------------------- |
| `label`      | string | any string    | `''`    | When empty, label row is omitted. |
| `name`       | string | any string    | `''`    | Applied to `<label for>`.         |
| default slot | slot   | field content | N/A     | Required for practical use.       |

## Size Specification

| Size | Height         | Min width   | Padding X | Padding Y | Gap                                                                | Radius | Border width | Typography                                                                       | Icon size | Notes                                              |
| ---- | -------------- | ----------- | --------- | --------- | ------------------------------------------------------------------ | ------ | ------------ | -------------------------------------------------------------------------------- | --------- | -------------------------------------------------- |
| base | content-driven | slot-driven | `0`       | `0`       | outer stack `tokens.spacing[3]` = `8px`; inner stack gap Not found | N/A    | `0`          | label uses `NvText type='label'`; resolved typography not defined in this folder | N/A       | This folder does not define field surface styling. |

## Variant And State Style Tables

| Theme      | Variant | State | Text color               | Background color | Border color | Border width | Shadow / focus ring | Radius | Opacity | Notes                                             |
| ---------- | ------- | ----- | ------------------------ | ---------------- | ------------ | ------------ | ------------------- | ------ | ------- | ------------------------------------------------- |
| light/dark | base    | rest  | Not found in this folder | transparent      | none         | `0`          | none                | N/A    | `1`     | Visual behavior comes from child field component. |

## Structure / Anatomy

| Part          | Source of truth                          | Visual role                          | Relevant styling                          | Export note                    |
| ------------- | ---------------------------------------- | ------------------------------------ | ----------------------------------------- | ------------------------------ |
| root stack    | `NvStack spacing='3'`                    | Vertical field wrapper               | Creates label-to-control spacing          | Model as vertical auto-layout. |
| label row     | `NvText type='label'` wrapping `<label>` | Field label                          | Only rendered when `label` prop is truthy | Optional text layer.           |
| content stack | inner `NvStack`                          | Holds field control / helper content | No local styling in this folder           | Optional slot container.       |

## Token Mapping

| Concern                | Token                    | Resolved value | Where used                            |
| ---------------------- | ------------------------ | -------------- | ------------------------------------- |
| outer vertical spacing | `tokens.spacing[3]`      | `8px`          | space between label and content stack |
| label typography       | Not found in this folder | Not found      | delegated to `NvText`                 |

## Recommended Figma Mapping

| Figma property | Type    | Suggested values | Derived from          |
| -------------- | ------- | ---------------- | --------------------- |
| `Label`        | boolean | `true, false`    | `label` prop presence |
| `Content`      | slot    | consumer-defined | default slot          |

## Gaps / Assumptions

| Item                      | Status      | Notes                                                    |
| ------------------------- | ----------- | -------------------------------------------------------- |
| Helper text / error text  | Unsupported | Not implemented in this folder.                          |
| Invalid / required states | Unsupported | No props or styles for these states.                     |
| Inner stack spacing       | Not found   | `NvStack` default spacing is not defined in this folder. |
