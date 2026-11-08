<template>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvTooltip>
        <NvText>Guided tour</NvText>
        <template #reference>
          <NvButton
            aria-label="Guided tour"
            icon-name="question-circle"
            size="sm"
            @click="startTour"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Messages</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name?.startsWith('messages') &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="messages-button"
            icon-name="comment-alt-lines"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'messages-history' })"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Settings</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name?.startsWith('settings') &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="settings-button"
            icon-name="setting"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'settings-general' })"
          />
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
  <NvCard size="sm">
    <NvGroup :spacing="2">
      <NvTooltip>
        <NvText>Close</NvText>
        <template #reference>
          <NvButton icon-name="times" size="xs" type="plain" @click="hide" />
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
  <VTour
    ref="tour"
    :steps="steps"
    @onTourStart="focusTourAction"
    @onTourEnd="releaseTourFocus"
  >
    <template #content="{ step }">
      <NvText data-nv-tour-content>
        {{ steps[step.currentStep].content }}
      </NvText>
    </template>
    <template #actions="scope">
      <NvGroup :key="scope.step.currentStep" justify="apart">
        <span></span>
        <NvGroup>
          <NvButton
            data-nv-tour-close
            :type="
              scope.step.currentStep !== steps.length - 1 ? 'plain' : 'default'
            "
            size="sm"
            @click.prevent="scope.endTour()"
            >Close
          </NvButton>
          <NvButton
            v-if="
              scope.step.currentStep > 0 &&
              scope.step.currentStep !== steps.length - 1
            "
            size="sm"
            @click.prevent="scope.prevStep()"
            >Previous
          </NvButton>
          <NvButton
            v-if="scope.step.currentStep !== steps.length - 1"
            data-nv-tour-next
            size="sm"
            @click.prevent="scope.nextStep()"
            >Next
          </NvButton>
        </NvGroup>
      </NvGroup>
    </template>
  </VTour>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
import { inject, nextTick, onBeforeUnmount, ref } from 'vue'
import { createFocusTrap, type FocusTrap } from 'focus-trap'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/features/settings/store'
import { isGameOverlay } from '@/consts.ts'
import { emitIPCGameOverlayStopIntercept } from '@/electron/events/renderer.ts'

const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const { ElectronMessengerWindow } = window
const route = useRoute()

const hide = () => {
  ElectronMessengerWindow.hide()
  if (isGameOverlay) {
    emitIPCGameOverlayStopIntercept()
  }
}
const tour = ref<{ resetTour: () => void }>()
let tourFocusTrap: FocusTrap | undefined
function releaseTourFocus(returnFocus = true) {
  tourFocusTrap?.deactivate({ returnFocus })
  tourFocusTrap = undefined
  document.getElementById('vjt-tooltip')?.removeAttribute('aria-modal')
}
onBeforeUnmount(() => releaseTourFocus(false))
const startTour = () => {
  // resetTour starts the installed tour after resetting its saved progress.
  tour.value?.resetTour()
}
async function focusTourAction() {
  await nextTick()
  const panel = document.getElementById('vjt-tooltip')
  if (!panel || panel.hasAttribute('data-hidden')) return
  panel.setAttribute('role', 'dialog')
  panel.setAttribute('aria-label', 'Guided tour')
  panel.setAttribute('aria-modal', 'true')
  panel.tabIndex = -1
  const primaryAction = () =>
    panel.querySelector<HTMLButtonElement>('[data-nv-tour-next]') ||
    panel.querySelector<HTMLButtonElement>('[data-nv-tour-close]') ||
    panel
  tourFocusTrap ??= createFocusTrap(panel, {
    initialFocus: primaryAction,
    fallbackFocus: panel,
    delayInitialFocus: false,
    escapeDeactivates: false,
    setReturnFocus: () =>
      document.querySelector<HTMLElement>('button[aria-label="Guided tour"]') ||
      false,
  })
  tourFocusTrap.activate()
  primaryAction().focus({ preventScroll: true })
}
const steps = [
  {
    target: '[data-v-step="messenger-text-input"]',
    content: 'You can input any message you want Izabela to speak here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="messenger-text-input-submit"]',
    content:
      'You can send the message by pressing [Enter] inside the text input or by clicking on the [Send] button here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="engine-select"]',
    content:
      'You can select a different speech engine here. Each speech engines come with a unique set of voices so it is recommended to explore them based on your preferences!',
    placement: 'top',
  },
  {
    target: '[data-v-step="engine-voice-select"]',
    content:
      'You can select a different voice supported by the selected speech engine here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="audio-outputs-select"]',
    content:
      'You can select different audio outputs here. By default, Izabela will always speak on your default playback device. If you want to use Izabela as an audio input, select your preferred virtual audio cable here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="audio-input-select"]',
    content:
      'If you want to use Speech Recognition (speech-to-text-to-speech), you can select an audio input here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="speech-settings-button"]',
    content:
      'You can access more advanced parameters for each speech engines in the speech settings here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="message-mode-buttons"]',
    content:
      'You can select a different speaking strategy here. Sentence mode will send a message after every [Enter] key press. Word mode will send a message after every [Enter] or [Space] key press.',
    placement: 'top',
  },
  {
    target: '[data-v-step="translation-button"]',
    content:
      'You can enable translation to translate messages before sending them here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="dictionary-button"]',
    content:
      'You can provide the definition of some words to improve their pronunciation here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="message-shortcuts-button"]',
    content: 'You can bind messages to keyboard shortcuts here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="message-history-button"]',
    content:
      'You can see a list of your latest messages here. You can replay them or download them locally.',
    placement: 'top',
  },
  {
    target: '[data-v-step="messages-button"]',
    content: 'You can access all message related pages here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="settings-button"]',
    content: 'You can access the settings here.',
    placement: 'top',
  },
  {
    target: '[data-v-step="handle-bar"]',
    content: `You can move the window by dragging the bar here.`,
    placement: 'top',
  },
  {
    target: '[data-v-step="messenger-window"]',
    content: `Finally, you can toggle the window by pressing ${settingsStore.keybindings.toggleMessengerWindow
      .map((k) => `[${k.key}]`)
      .join(
        ' + ',
      )}. If the text input is focused, you can also press [Esc] to close the window.`,
    placement: 'top',
  },
].map((step) => ({ ...step, onShow: focusTourAction }))
</script>
