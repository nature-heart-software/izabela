import { cva } from '@/styled-system/css'
import { pandaComponent } from '@/utils/panda'
import { props } from './button.shared'

export const buttonRecipe = cva({
  base: {
    flexShrink: '0',
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    fontWeight: '600',
    borderWidth: '1px',
    borderStyle: 'solid',
    outline: '0',
    transition: 'all .3s',
    overflow: 'hidden',
    '& .nv-button__icon': { pointerEvents: 'none' },
    // Keep the pending indicator inside the existing hit target without disabling it.
    '& .nv-button__loading': {
      position: 'absolute',
      inset: '0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'inherit',
      pointerEvents: 'none',
    },
    '& .nv-button__loading > span': {
      width: '4',
      height: '4',
      border: '2px solid currentColor',
      borderRightColor: 'transparent',
      borderRadius: '50%',
      animation: 'spin .75s linear infinite',
      '@media (prefers-reduced-motion: reduce)': { animation: 'none' },
    },
  },
  variants: {
    size: {
      xs: {
        height: '5',
        paddingX: '2',
        borderRadius: 'xs',
        fontSize: '0.75rem',
        lineHeight: 'default',
        letterSpacing: 'default',
        '& .nv-button__icon': { right: '1' },
      },
      sm: {
        height: '6',
        paddingX: '3',
        borderRadius: 'sm',
        fontSize: '0.75rem',
        lineHeight: 'default',
        letterSpacing: 'default',
        '& .nv-button__icon': { right: '2' },
      },
      md: {
        height: '7',
        paddingX: '5',
        borderRadius: 'md',
        fontSize: '0.75rem',
        lineHeight: 'default',
        letterSpacing: 'default',
        '& .nv-button__icon': { right: '2' },
      },
      lg: {
        height: '8',
        paddingX: '5',
        borderRadius: 'md',
        fontSize: '0.875rem',
        lineHeight: 'default',
        letterSpacing: 'default',
        '& .nv-button__icon': { right: '3' },
      },
    },
    squared: {
      true: { paddingX: '0', paddingY: '0', justifyContent: 'center' },
      false: { '& .nv-button__icon': { position: 'absolute' } },
    },
    align: {
      left: { justifyContent: 'left' },
      center: { justifyContent: 'center' },
      right: { justifyContent: 'right' },
      start: { justifyContent: 'start' },
      end: { justifyContent: 'end' },
      justify: { justifyContent: 'space-between' },
      matchParent: {},
    },
    type: {
      default: {
        color: 'button.default.text',
        backgroundColor: 'button.default.background',
        borderColor: 'button.default.border',
        '&:hover': {
          backgroundColor: 'button.default.hover.background',
          borderColor: 'button.default.hover.border',
        },
        '&:active': {
          backgroundColor: 'button.default.pressed.background',
          borderColor: 'button.default.pressed.border',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem {colors.button.default.focus.ring}',
        },
        '&[data-selected]': {
          backgroundColor: 'button.default.selected.background',
          borderColor: 'button.default.selected.border',
        },
      },
      active: {
        color: 'button.active.text',
        backgroundColor: 'button.active.background',
        borderColor: 'button.active.border',
        borderWidth: '2px',
        '&:hover': {
          backgroundColor: 'button.active.hover.background',
          borderColor: 'button.active.hover.border',
        },
        '&:active': {
          backgroundColor: 'button.active.pressed.background',
          borderColor: 'button.active.pressed.border',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem {colors.button.active.focus.ring}',
        },
        '&[data-selected]': {
          backgroundColor: 'button.active.selected.background',
          borderColor: 'button.active.selected.border',
        },
      },
      plain: {
        color: 'button.plain.text',
        backgroundColor: 'button.plain.background',
        borderColor: 'button.plain.border',
        '&:hover': {
          borderColor: 'button.plain.hover.border',
          backgroundColor: 'button.plain.hover.background',
        },
        '&:active': {
          borderColor: 'button.plain.pressed.border',
          backgroundColor: 'button.plain.pressed.background',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem {colors.button.plain.focus.ring}',
        },
        '&[data-selected]': {
          borderColor: 'button.plain.selected.border',
          backgroundColor: 'button.plain.selected.background',
        },
      },
      ghost: {
        color: 'button.ghost.text',
        backgroundColor: 'button.ghost.background',
        borderColor: 'button.ghost.border',
        '&:hover': {
          backgroundColor: 'button.ghost.hover.background',
          borderColor: 'button.ghost.hover.border',
        },
        '&:active': {
          backgroundColor: 'button.ghost.pressed.background',
          borderColor: 'button.ghost.pressed.border',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem {colors.button.ghost.focus.ring}',
        },
        '&[data-selected]': {
          backgroundColor: 'button.ghost.selected.background',
          borderColor: 'button.ghost.selected.border',
        },
      },
      'ghost-alt': {
        color: 'button.ghost-alt.text',
        backgroundColor: 'button.ghost-alt.background',
        borderColor: 'button.ghost-alt.border',
        '&:hover': {
          backgroundColor: 'button.ghost-alt.hover.background',
          borderColor: 'button.ghost-alt.hover.border',
        },
        '&:active': {
          backgroundColor: 'button.ghost-alt.pressed.background',
          borderColor: 'button.ghost-alt.pressed.border',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem {colors.button.ghost-alt.focus.ring}',
        },
        '&[data-selected]': {
          boxShadow: 'card.default.shadow',
          backgroundColor: 'button.ghost-alt.selected.background',
          borderColor: 'button.ghost-alt.selected.border',
        },
      },
    },
    hasIcon: { true: {} },
  },
  compoundVariants: [
    { size: 'xs', squared: true, css: { width: '5' } },
    { size: 'sm', squared: true, css: { width: '6' } },
    { size: 'md', squared: true, css: { width: '7' } },
    { size: 'lg', squared: true, css: { width: '8' } },
    { size: 'xs', squared: false, hasIcon: true, css: { paddingRight: '5' } },
    { size: 'sm', squared: false, hasIcon: true, css: { paddingRight: '6' } },
    { size: 'md', squared: false, hasIcon: true, css: { paddingRight: '7' } },
    {
      size: 'lg',
      squared: false,
      hasIcon: true,
      css: { paddingLeft: '6', paddingRight: '8' },
    },
  ],
  defaultVariants: { size: 'md', type: 'default', squared: false },
})
export const StButton = pandaComponent('button', props, (props) =>
  buttonRecipe({
    ...props,
    // Ark as-child supplies native type="button" when no visual type was set.
    type: props.type === 'button' ? 'default' : props.type,
    hasIcon: Boolean(props.iconName),
  }),
)
