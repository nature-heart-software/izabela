import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { selectProps } from './select.shared'

const select = cva({
  base: {
    // The input, selection tags and indicator share the primitive's hit target.
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    width: '100%',
    cursor: 'pointer',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'select.default.border',
    color: 'select.default.text',
    backgroundColor: 'select.default.background',
    transition: 'all 0.15s ease',
    _hover: {
      borderColor: 'select.default.hover.border',
      color: 'select.default.hover.text',
      backgroundColor: 'select.default.hover.background',
      '& input': {
        color: 'select.default.hover.text',
        backgroundColor: 'select.default.hover.background',
      },
      '& svg': { color: 'select.default.hover.icon' },
    },
  },
  variants: {
    size: {
      sm: {
        borderRadius: 'sm',
        paddingInline: '3',
        paddingRight: 'calc({spacing.3} + {spacing.5})',
        paddingBlock: '2',
        minHeight: '6',
        fontSize: '0.75rem',
        lineHeight: 'default',
        letterSpacing: 'default',
      },
      md: {
        borderRadius: 'md',
        paddingInline: '5',
        paddingRight: '2rem',
        paddingBlock: '2',
        minHeight: '7',
        fontSize: '0.75rem',
        lineHeight: 'default',
        letterSpacing: 'default',
      },
      lg: {
        borderRadius: 'md',
        paddingInline: '6',
        paddingRight: '2.5rem',
        paddingBlock: '2',
        minHeight: '8',
        fontSize: '0.875rem',
        lineHeight: 'default',
        letterSpacing: 'default',
      },
    },
    isFocused: {
      true: {
        color: 'select.default.focus.text',
        backgroundColor: 'select.default.focus.background',
        '& input': {
          color: 'select.default.focus.text',
          backgroundColor: 'select.default.focus.background',
        },
        '& svg': { color: 'select.default.focus.icon' },
        boxShadow: '0 0 0 0.25rem {colors.select.default.focus.focus-ring}',
        borderColor: 'select.default.focus.border',
      },
    },
  },
  defaultVariants: { size: 'md' },
})
const wrapper = cva({
  base: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    marginBlock: '-1px',
    fontWeight: '600',
  },
})
const tags = cva({ base: { marginLeft: '-0.75rem' } })
const input = cva({
  base: {
    cursor: 'pointer',
    outline: 'none',
    border: '0',
    padding: '0',
    width: '100%',
    font: 'inherit',
    letterSpacing: 'inherit',
    color: 'select.default.text',
    backgroundColor: 'select.default.background',
    _placeholder: {
      color: 'select.default.placeholder',
      fontWeight: '300',
    },
  },
  variants: {
    size: { sm: { height: '5' }, md: { height: '6' }, lg: { height: '7' } },
  },
  defaultVariants: { size: 'md' },
})
const icon = cva({
  base: {
    color: 'select.default.icon',
    display: 'inline-flex',
    pointerEvents: 'none',
    position: 'absolute',
  },
  variants: {
    size: { sm: { right: '2' }, md: { right: '2' }, lg: { right: '3' } },
  },
  defaultVariants: { size: 'md' },
})
const option = cva({
  base: {
    // A virtualized row must retain the fixed geometry used by the virtualizer.
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    height: '7',
    paddingInline: '5',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: 'default',
    letterSpacing: 'default',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '0',
    color: 'option.default.text',
    '& .option__content': { position: 'relative', zIndex: '0', minWidth: '0' },
    '& .option__after': { flexShrink: '0', '& > *': { marginLeft: '3' } },
    _hover: {
      backgroundColor: 'option.default.hover.background',
      color: 'option.default.hover.text',
    },
  },
  variants: {
    selected: {
      true: {
        fontWeight: '700',
        backgroundColor: 'option.default.selected.background',
        color: 'option.default.selected.text',
      },
    },
    active: {
      true: {
        backgroundColor: 'option.default.active.background',
        color: 'option.default.active.text',
      },
    },
    disabled: {
      true: {
        pointerEvents: 'none',
        userSelect: 'none',
        color: 'option.default.disabled.text',
      },
    },
    readonly: {
      true: {
        cursor: 'default',
        color: 'option.default.readonly.text',
        position: 'relative',
        zIndex: '0',
        _before: {
          content: "''",
          position: 'absolute',
          top: '50%',
          left: '0',
          width: '100%',
          height: '1px',
          backgroundColor: 'option.default.readonly.separator',
          zIndex: '-1',
        },
        '& .option__content': {
          backgroundColor: 'option.default.readonly.label-mask-background',
          paddingInline: '2',
        },
      },
    },
  },
})
export const StSelect = pandaComponent('div', selectProps, select)
export const StSelectWrapper = pandaComponent('div', selectProps, wrapper)
export const StSelectTagsWrapper = pandaComponent('div', {}, tags)
export const StSelectInput = pandaComponent('input', selectProps, input)
export const StSelectIcon = pandaComponent('div', selectProps, icon)
export const StSelectOption = pandaComponent(
  'div',
  {
    selected: Boolean,
    disabled: Boolean,
    active: Boolean,
    readonly: Boolean,
  },
  option,
)
