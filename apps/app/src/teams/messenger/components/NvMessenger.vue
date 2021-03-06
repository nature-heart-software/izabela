<template>
  <div class="messengerWrapper">
    <DomBoundary id="moveable" ref="moveableTarget" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/95 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none"
      >
        <!-- Top -->
        <div class="flex space-x-4">
          <NvButton icon-name="info" type="plain" />
          <NvCard size="xs">
            <div class="inline-flex space-x-2">
              <NvButton icon-name="github-alt" size="sm" />
              <NvButton icon-name="twitter-alt" size="sm" />
              <NvButton icon-name="discord" size="sm" />
            </div>
          </NvCard>
          <div class="flex flex-1 justify-end space-x-4 moveable-handle cursor-all-scroll">
            <NvCard class="flex-1 min-h-8" size="xs">
              <div class="inline-flex space-x-2">
                <template v-if="$store.getters['settings/persisted'].debugMode">
                  <NvButton icon-name="redo" size="sm" @click="reload" />
                  <NvButton icon-name="brackets-curly" size="sm" @click="openDevTools" />
                </template>
              </div>
            </NvCard>
            <NvCard size="xs">
              <div class="inline-flex items-center space-x-2">
                <NvButton icon-name="comment-alt-lines" size="sm" />
                <NvDivider class="h-3" direction="vertical" />
                <NvButton icon-name="setting" size="sm" />
              </div>
            </NvCard>
            <NvCard class="inline-flex" size="sm">
              <div class="inline-flex space-x-2">
                <!-- <NvButton size="xs" type="plain" icon-name="minus"/>
                <NvButton size="xs" type="plain" icon-name="square-full"/> -->
                <NvButton icon-name="times" size="xs" type="plain" @click="hide" />
              </div>
            </NvCard>
          </div>
        </div>

        <!-- Middle -->
        <div class="flex justify-between">
          <NvCard class="inline-flex items-center space-x-3" size="sm">
            <span ref="settingsToggler">
              <NvButton icon-name="setting" size="sm" />
            </span>
            <NvDivider class="h-3" direction="vertical" />
            <SpeechEngineSelect
              :modelValue="$store.getters['settings/persisted'].selectedSpeechEngine"
              class="w-13"
              icon-name="direction"
              placeholder="Speech Engine"
              size="sm"
              @update:modelValue="
                (value) =>
                  $store.dispatch('settings/setProperty', ['persisted.selectedSpeechEngine', value])
              "
            />
            <template v-if="$store.getters['settings/persisted'].selectedSpeechEngine === 'gctts'">
              <GCTTSVoiceSelect
                :modelValue="$store.getters['settings/persisted'].GCTTSSelectedVoice"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.GCTTSSelectedVoice', value])
                "
              />
            </template>
            <template v-if="$store.getters['settings/persisted'].selectedSpeechEngine === 'iwtts'">
              <IWTTSVoiceSelect
                :modelValue="$store.getters['settings/persisted'].IWTTSSelectedVoice"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.IWTTSSelectedVoice', value])
                "
              />
            </template>
            <template v-if="$store.getters['settings/persisted'].selectedSpeechEngine === 'matts'">
              <MATTSVoiceSelect
                :modelValue="$store.getters['settings/persisted'].MATTSSelectedVoice"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.MATTSSelectedVoice', value])
                "
              />
            </template>
            <template v-if="$store.getters['settings/persisted'].selectedSpeechEngine === 'aptts'">
              <APTTSVoiceSelect
                :modelValue="$store.getters['settings/persisted'].APTTSSelectedVoice"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.APTTSSelectedVoice', value])
                "
              />
            </template>
            <template v-if="$store.getters['settings/persisted'].selectedSpeechEngine === 'saytts'">
              <SayTTSVoiceSelect
                :modelValue="$store.getters['settings/persisted'].SayTTSSelectedVoice"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', [
                      'persisted.SayTTSSelectedVoice',
                      value,
                    ])
                "
              />
            </template>
            <NvDivider class="h-3" direction="vertical" />
            <NvButton icon-name="direction" size="sm">Outputs</NvButton>
            <NvButton icon-name="direction" size="sm">Input</NvButton>
            <NvDivider class="h-3" direction="vertical" />
            <NvButton icon-name="question-circle" size="sm" />
          </NvCard>
          <NvCard class="inline-flex items-center space-x-3" size="sm">
            <NvButton size="sm" type="plain">Sentence</NvButton>
            <NvButton size="sm">Word</NvButton>
            <NvDivider class="h-3" direction="vertical" />
            <NvButton icon-name="question-circle" size="sm" />
          </NvCard>
        </div>

        <!-- Bottom -->
        <div>
          <NvCard class="flex space-x-3" size="sm">
            <NvInput
              ref="messengerInput"
              v-model="inputValue"
              class="w-full"
              placeholder="So, said the angel to the child who, divided, broke the knife.."
              size="lg"
              @keydown.enter="playMessage()"
            />
            <NvButton icon-name="message" size="lg" @click="playMessage()" />
          </NvCard>
        </div>
      </div>
    </DomBoundary>
    <Moveable
      ref="moveable"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :dragTarget="doc.querySelector('.moveable-handle')"
      :draggable="true"
      :elementGuidelines="[doc.querySelector('body')]"
      :resizable="false"
      :rotatable="false"
      :scalable="false"
      :snapDirections="{
        center: true,
        middle: true,
      }"
      :snapThreshold="40"
      :snappable="true"
      :verticalGuidelines="[viewport.width / 2]"
      className="opacity-0"
      target="#moveable"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts" setup>
import { ComponentPublicInstance, computed, defineProps, onMounted, ref } from 'vue'
import Moveable from 'vue3-moveable'
import { NvButton, NvCard } from '@/core/components'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import NvDivider from '@/core/components/Divider/NvDivider.vue'
import NvInput from '@/core/components/Input/NvInput.vue'
import store from '@/store'
import { useSettingsPopover } from '@/entities/settings/hooks'
import SpeechEngineSelect from '@/entities/speech/components/inputs/NvSpeechEngineSelect.vue'
import APTTSVoiceSelect from '@/entities/speech/components/inputs/NvAPTTSVoiceSelect.vue'
import IWTTSVoiceSelect from '@/entities/speech/components/inputs/NvIWTTSVoiceSelect.vue'
import GCTTSVoiceSelect from '@/entities/speech/components/inputs/NvGCTTSVoiceSelect.vue'
import MATTSVoiceSelect from '@/entities/speech/components/inputs/NvMATTSVoiceSelect.vue'
import SayTTSVoiceSelect from '@/entities/speech/components/inputs/NvSayTTSVoiceSelect.vue'

const { ElectronMessengerWindow, ipc } = window
const componentProps = defineProps({
  width: {
    type: Number,
    default: null,
  },
  minWidth: {
    type: Number,
    default: null,
  },
  maxWidth: {
    type: Number,
    default: null,
  },
  height: {
    type: Number,
    default: null,
  },
  minHeight: {
    type: Number,
    default: null,
  },
  maxHeight: {
    type: Number,
    default: null,
  },
  transform: {
    type: String,
    default: null,
  },
})

const messenger = ref()

const settingsToggler = ref()

const moveable = ref()
const moveableTarget = ref()
const messengerInput = ref()

const inputValue = ref('')
const doc = document
useSettingsPopover({
  popoverTarget: messenger,
  popoverOptions: {
    triggerTarget: settingsToggler,
  },
})

const viewport = computed(() => ({
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
}))

const savePosition = (event: any) => {
  const { width, height, translate, transform } = event
  store.dispatch('messenger/setProperties', [
    ['persisted.position.transform', transform],
    ['persisted.position.width', width],
    ['persisted.position.height', height],
    ['persisted.position.translate', translate],
  ])
}

const openDevTools = () => {
  ElectronMessengerWindow.openDevTools()
}

const hide = () => {
  ElectronMessengerWindow.hide()
}

const reload = () => {
  window.location.reload()
}

const onDrag = (event: any) => {
  const { target, transform } = event
  target.style.transform = transform
  savePosition(event)
}

const playMessage = () => {
  if (inputValue.value) {
    ipc.sendTo('speech-worker', 'say', inputValue.value)
    inputValue.value = ''
  }
}

const onWindowFocus = () => {
  // const componentInstance = messengerInput.value as ComponentPublicInstance
  // const input = componentInstance.$el.querySelector('input')
  // if (input) input.focus()
}

const onWindowBlur = () => {
  const componentInstance = messengerInput.value as ComponentPublicInstance
  const input = componentInstance.$el.querySelector('input')
  if (input) input.blur()
}

const addEventListeners = () => {
  ipc.on('main', 'focus', onWindowFocus)
  ipc.on('main', 'blur', onWindowBlur)
}

onMounted(() => {
  const moveableTargetEl = (moveableTarget.value as ComponentPublicInstance)
    .$el as HTMLDivElement | null
  if (moveableTargetEl) {
    if (componentProps.width) moveableTargetEl.style.width = `${componentProps.width}px`
    if (componentProps.minWidth) moveableTargetEl.style.minWidth = `${componentProps.minWidth}px`
    if (componentProps.maxWidth) moveableTargetEl.style.maxWidth = `${componentProps.maxWidth}px`
    if (componentProps.height) moveableTargetEl.style.height = `${componentProps.height}px`
    if (componentProps.minHeight) moveableTargetEl.style.minHeight = `${componentProps.minHeight}px`
    if (componentProps.maxHeight) moveableTargetEl.style.maxHeight = `${componentProps.maxHeight}px`
    if (componentProps.transform) moveableTargetEl.style.transform = componentProps.transform
  }
  moveable.value.updateTarget()
  addEventListeners()

  /* This fixes focus on focusable elements. Focus won't work unless
   * the window has been dragged once with draggable for some reasons
   * */
  moveable.value.request('draggable', { deltaX: -1, deltaY: -1 }, true)
  moveable.value.request('draggable', { deltaX: 1, deltaY: 1 }, true)
})
</script>
<style lang="scss" scoped>
.messenger {
  min-width: 768px;
}
</style>
