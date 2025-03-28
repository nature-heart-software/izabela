/* eslint-disable */
import styled, { injectGlobal } from 'vue3-styled-components'
import { Dialog } from '@ark-ui/vue'
import { tokens } from '@/styles/tokens'
import { rem, rgba } from 'polished'

const { colors, spacing } = tokens

export const StDialogRoot = styled(Dialog.Root)``
export const StDialogTrigger = styled(Dialog.Trigger)``
export const StDialogBackdrop = styled(Dialog.Backdrop)`
  position: absolute;
  z-index: 9999;
  inset: 0;
  background-color: ${() => rgba(colors.gray['100'], 0.95)};
`
export const StDialogPositioner = styled(Dialog.Positioner)`
  position: absolute;
  z-index: 9999;
  inset: 0;
  display: grid;
  place-items: center;

  & > * {
    min-height: auto;
  }
`
export const StDialogContent = styled(Dialog.Content)`
  padding: ${() => rem(spacing['3'])};
  width: 100%;
  max-width: 480px;
`
export const StDialogTitle = styled(Dialog.Title)``
export const StDialogDescription = styled(Dialog.Description)``
export const StDialogCloseTrigger = styled(Dialog.CloseTrigger)``
