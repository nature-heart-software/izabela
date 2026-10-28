import {
  NvButton,
  NvSwitch,
  NvRangeInput,
  NvSelect,
  NvInput,
  NvTextarea,
  NvAutocomplete,
  NvDialog,
  themes,
  tokens,
  PORTAL_TARGET,
} from '..'

type Props<T extends abstract new (...args: any[]) => any> =
  InstanceType<T>['$props']
const button: Props<typeof NvButton> = {
  size: 'xs',
  type: 'ghost',
  loading: true,
  iconName: 'times',
}
const toggle: Props<typeof NvSwitch> = { modelValue: false }
const range: Props<typeof NvRangeInput> = { modelValue: 2 }
const select: Props<typeof NvSelect> = {
  options: [{ label: 'One', value: { id: 1 } }],
  multiple: true,
  valueKey: 'id',
  modelValue: [{ id: 1 }],
}
const input: Props<typeof NvInput> = { size: 'lg', modelValue: 'text' }
const textarea: Props<typeof NvTextarea> = { size: 'sm', modelValue: 'text' }
const autocomplete: Props<typeof NvAutocomplete> = {
  options: ['a'],
  visible: true,
  placement: 'bottom-end',
  selectOnTab: true,
}
const dialog: Props<typeof NvDialog> = { open: false }
type IsAny<T> = 0 extends 1 & T ? true : false
const buttonIsNotAny: IsAny<typeof NvButton> = false
const propsAreNotAny: IsAny<Props<typeof NvButton>> = false
const modelIsNotAny: IsAny<Props<typeof NvSwitch>['modelValue']> = false
void [
  button,
  toggle,
  range,
  select,
  input,
  textarea,
  autocomplete,
  dialog,
  themes,
  tokens,
  PORTAL_TARGET,
  buttonIsNotAny,
  propsAreNotAny,
  modelIsNotAny,
]
// @ts-expect-error Button variants are constrained.
const badButton: Props<typeof NvButton> = { type: 'danger' }
// @ts-expect-error Sizes are constrained.
const badSize: Props<typeof NvInput> = { size: 'huge' }
// @ts-expect-error Switch models are boolean.
const badToggle: Props<typeof NvSwitch> = { modelValue: 'yes' }
// @ts-expect-error Range model props are numeric (string update is a runtime known issue).
const badRange: Props<typeof NvRangeInput> = { modelValue: '2' }
// @ts-expect-error Select options require labels.
const badSelect: Props<typeof NvSelect> = { options: [{ value: 1 }] }
// @ts-expect-error Popover placement is constrained.
const badPlacement: Props<typeof NvAutocomplete> = { placement: 'somewhere' }
// @ts-expect-error Dialog open state is boolean.
const badDialog: Props<typeof NvDialog> = { open: 'yes' }
