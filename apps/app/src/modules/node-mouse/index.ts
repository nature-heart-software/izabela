import initMouse from '@packages/win-mouse'

export const mouse = typeof window === 'undefined' ? initMouse() : null

export const destroyWinMouse = () => {
  mouse?.destroy()
}
