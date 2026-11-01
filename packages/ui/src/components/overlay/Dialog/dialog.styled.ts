/* eslint-disable */
import styled from 'vue3-styled-components'
import { Dialog } from '@ark-ui/vue'
import { tokens } from '@/styles/tokens'
import { themes } from '@/themes'
import { rem, rgba } from 'polished'

const { spacing } = tokens

export const StDialogRoot = styled(Dialog.Root)``
export const StDialogTrigger = styled(Dialog.Trigger)``
export const StDialogBackdrop = styled(Dialog.Backdrop)`
  position: absolute;
  z-index: 9999;
  inset: 0;
  background-color: ${({ theme }) =>
    rgba(theme.dialog.backdropColor, theme.dialog.backdropOpacity)};
`
export const StDialogPositioner = styled(Dialog.Positioner)`
  position: absolute;
  z-index: 9999;
  inset: 0;
`
export const StDialogContent = styled('div')`
  max-width: 480px;
  width: 100%;
`
export const StDialogContentWrapper = styled(Dialog.Content)`
  width: 100%;
  height: 100%;
  position: relative;

  &:not([hidden]) {
    display: grid;
  }

  place-items: center;
  overflow: auto;
  pointer-events: auto;

  & > * {
    min-height: auto;
  }

  padding: ${() => rem(spacing['3'])};
`
export const StDialogTitle = styled(Dialog.Title)``
export const StDialogDescription = styled(Dialog.Description)``
export const StDialogCloseTrigger = styled(Dialog.CloseTrigger)``
