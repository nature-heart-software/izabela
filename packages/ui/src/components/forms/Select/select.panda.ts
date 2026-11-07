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
    borderColor: 'var(--nv-select-border-color)',
    color: 'var(--nv-select-color)',
    backgroundColor: 'var(--nv-select-background-color)',
    transition: 'all 0.15s ease',
    _hover: { borderColor: 'var(--nv-select-hover-border-color)' },
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
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
      },
      md: {
        borderRadius: 'md',
        paddingInline: '5',
        paddingRight: '2rem',
        paddingBlock: '2',
        minHeight: '7',
        fontSize: '0.75rem',
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
      },
      lg: {
        borderRadius: 'md',
        paddingInline: '6',
        paddingRight: '2.5rem',
        paddingBlock: '2',
        minHeight: '8',
        fontSize: '0.875rem',
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
      },
    },
    isFocused: {
      true: {
        boxShadow: '0 0 0 0.25rem var(--nv-select-focus-box-shadow)',
        borderColor: 'var(--nv-select-focus-border-color)',
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
    color: 'var(--nv-select-color)',
    backgroundColor: 'var(--nv-select-background-color)',
    _placeholder: {
      color: 'var(--nv-select-placeholder-color)',
      fontWeight: '300',
    },
  },
  variants: {
    size: { sm: { height: '5' }, md: { height: '6' }, lg: { height: '7' } },
  },
  defaultVariants: { size: 'md' },
})
const icon = cva({
  base: { display: 'inline-flex', pointerEvents: 'none', position: 'absolute' },
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
    lineHeight: '2',
    letterSpacing: '2',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: '0',
    color: 'var(--nv-text-color)',
    '& .option__content': { position: 'relative', zIndex: '0', minWidth: '0' },
    '& .option__after': { flexShrink: '0', '& > *': { marginLeft: '3' } },
    _hover: {
      backgroundColor: 'var(--nv-select-option-hover-background-color)',
    },
  },
  variants: {
    selected: {
      true: {
        fontWeight: '700',
        backgroundColor: 'var(--nv-select-option-selected-background-color)',
      },
    },
    active: {
      true: {
        backgroundColor: 'var(--nv-select-option-active-background-color)',
      },
    },
    disabled: {
      true: {
        pointerEvents: 'none',
        userSelect: 'none',
        color: 'var(--nv-select-option-disabled-background-color)',
      },
    },
    readonly: {
      true: {
        cursor: 'default',
        color: 'var(--nv-select-option-readonly-color)',
        position: 'relative',
        zIndex: '0',
        _before: {
          content: "''",
          position: 'absolute',
          top: '50%',
          left: '0',
          width: '100%',
          height: '1px',
          backgroundColor: 'var(--nv-select-option-readonly-border-color)',
          zIndex: '-1',
        },
        '& .option__content': {
          backgroundColor: 'var(--nv-select-option-background-color)',
          paddingInline: '2',
        },
      },
    },
  },
})
export const groupLabel = cva({
  base: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    paddingInline: '5',
    height: '7',
    fontFamily: 'sans',
    fontSize: '2',
    lineHeight: '2',
    letterSpacing: '2',
    cursor: 'default',
    color: 'var(--nv-select-option-readonly-color)',
    '&[hidden]': { display: 'none' },
    _before: {
      content: "''",
      position: 'absolute',
      top: '50%',
      left: '0',
      width: '100%',
      height: '1px',
      backgroundColor: 'var(--nv-select-option-readonly-border-color)',
    },
    '& > span': {
      position: 'relative',
      paddingInline: '2',
      backgroundColor: 'var(--nv-select-option-background-color)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
  },
})
export const StSelect = pandaComponent('div', selectProps, select)
export const StSelectGroupLabel = pandaComponent('div', {}, groupLabel)
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
