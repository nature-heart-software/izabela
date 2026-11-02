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
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
        '& .nv-button__icon': { right: '1' },
      },
      sm: {
        height: '6',
        paddingX: '3',
        borderRadius: 'sm',
        fontSize: '0.75rem',
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
        '& .nv-button__icon': { right: '2' },
      },
      md: {
        height: '7',
        paddingX: '5',
        borderRadius: 'md',
        fontSize: '0.75rem',
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
        '& .nv-button__icon': { right: '2' },
      },
      lg: {
        height: '8',
        paddingX: '5',
        borderRadius: 'md',
        fontSize: '0.875rem',
        lineHeight: '1.4',
        letterSpacing: '0.02rem',
        '& .nv-button__icon': { right: '3' },
      },
    },
    squared: {
      true: { padding: '0', justifyContent: 'center' },
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
        color: 'var(--nv-button-default-color)',
        backgroundColor: 'var(--nv-button-default-background-color)',
        borderColor: 'var(--nv-button-default-border-color)',
        '&:hover': {
          backgroundColor: 'var(--nv-button-default-hover-background-color)',
        },
        '&:active': {
          backgroundColor: 'var(--nv-button-default-active-background-color)',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem var(--nv-button-default-focus-box-shadow)',
        },
        '&[data-selected]': {
          backgroundColor: 'var(--nv-button-default-selected-background-color)',
        },
      },
      active: {
        color: 'var(--nv-button-active-color)',
        backgroundColor: 'var(--nv-button-active-background-color)',
        borderColor: 'var(--nv-button-active-border-color)',
        borderWidth: '2px',
        '&:hover': {
          backgroundColor: 'var(--nv-button-active-hover-background-color)',
        },
        '&:active': {
          backgroundColor: 'var(--nv-button-active-active-background-color)',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem var(--nv-button-active-focus-box-shadow)',
        },
        '&[data-selected]': {
          backgroundColor: 'var(--nv-button-active-selected-background-color)',
        },
      },
      plain: {
        color: 'var(--nv-button-plain-color)',
        backgroundColor: 'var(--nv-button-plain-background-color)',
        borderColor: 'var(--nv-button-plain-border-color)',
        '&:hover': {
          borderColor: 'var(--nv-button-plain-hover-border-color)',
          backgroundColor: 'var(--nv-button-plain-hover-background-color)',
        },
        '&:active': {
          borderColor: 'var(--nv-button-plain-active-border-color)',
          backgroundColor: 'var(--nv-button-plain-active-background-color)',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem var(--nv-button-plain-focus-box-shadow)',
        },
        '&[data-selected]': {
          borderColor: 'var(--nv-button-plain-selected-border-color)',
          backgroundColor: 'var(--nv-button-plain-selected-background-color)',
        },
      },
      ghost: {
        color: 'var(--nv-button-ghost-color)',
        backgroundColor: 'var(--nv-button-ghost-background-color)',
        borderColor: 'var(--nv-button-ghost-border-color)',
        '&:hover': {
          backgroundColor: 'var(--nv-button-ghost-hover-background-color)',
        },
        '&:active': {
          backgroundColor: 'var(--nv-button-ghost-active-background-color)',
        },
        '&:focus': {
          boxShadow: '0 0 0 0.25rem var(--nv-button-ghost-focus-box-shadow)',
        },
        '&[data-selected]': {
          backgroundColor: 'var(--nv-button-ghost-selected-background-color)',
        },
      },
      'ghost-alt': {
        color: 'var(--nv-button-ghost-alt-color)',
        backgroundColor: 'var(--nv-button-ghost-alt-background-color)',
        borderColor: 'var(--nv-button-ghost-alt-border-color)',
        '&:hover': {
          backgroundColor: 'var(--nv-button-ghost-alt-hover-background-color)',
        },
        '&:active': {
          backgroundColor: 'var(--nv-button-ghost-alt-active-background-color)',
        },
        '&:focus': {
          boxShadow:
            '0 0 0 0.25rem var(--nv-button-ghost-alt-focus-box-shadow)',
        },
        '&[data-selected]': {
          boxShadow: 'lg',
          backgroundColor:
            'var(--nv-button-ghost-alt-selected-background-color)',
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
