import { cva } from '@/styled-system/css'

export const loadingSpinner = cva({
  base: {
    display: 'block',
    width: '5',
    height: '5',
    color: 'loading.default.pending.spinner',
    animation: 'spin 2s linear infinite',
    _motionReduce: { animation: 'none' },
    '& > circle': {
      fill: 'none',
      stroke: 'currentColor',
      // Keep stroke and dash lengths in the same 50-unit SVG coordinate space.
      // A non-scaling stroke also changes dash units and can hide the whole arc.
      strokeWidth: '6.25',
      strokeLinecap: 'round',
      strokeDasharray: '90, 150',
      strokeDashoffset: '0',
      animation: 'nv-loading-dash 1.5s ease-in-out infinite',
      _motionReduce: { animation: 'none' },
    },
  },
})

export function createLoadingSpinner() {
  const namespace = 'http://www.w3.org/2000/svg'
  const spinner = document.createElementNS(namespace, 'svg')
  spinner.setAttribute('class', loadingSpinner())
  spinner.setAttribute('viewBox', '0 0 50 50')
  spinner.setAttribute('aria-hidden', 'true')
  const circle = document.createElementNS(namespace, 'circle')
  circle.setAttribute('cx', '25')
  circle.setAttribute('cy', '25')
  circle.setAttribute('r', '20')
  spinner.append(circle)
  return spinner
}
