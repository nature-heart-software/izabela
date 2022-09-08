<template>
  <div class="messengerWrapper">
    <DomBoundary id="moveable" ref="moveableTarget" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/95 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none"
      >
        <!-- Top -->
        <div class="flex space-x-4">
          <a href="https://github.com/nature-heart-software/izabela" target="_blank">
            <span class="hidden">GitHub</span>
            <NvButton icon-name="info" type="plain"/>
          </a>
          <NvCard size="xs">
            <div class="inline-flex space-x-2">
              <a href="https://github.com/nature-heart-software/izabela" target="_blank">
                <span class="hidden">GitHub</span>
                <NvButton icon-name="github-alt" size="sm"/>
              </a>
              <a href="https://twitter.com/wurielle" target="_blank">
                <span class="hidden">Twitter</span>
                <NvButton icon-name="twitter-alt" size="sm"/>
              </a>
              <a href="https://discord.gg/BmWtmYmaeQ" target="_blank">
                <span class="hidden">Discord</span>
                <NvButton icon-name="discord" size="sm"/>
              </a>
            </div>
          </NvCard>
          <div class="flex flex-1 justify-end space-x-4 moveable-handle cursor-all-scroll">
            <NvCard class="flex-1 min-h-8" size="xs">
              <div class="inline-flex space-x-2">
                <template v-if="settingsStore.debugMode">
                  <NvButton icon-name="redo" size="sm" @click="reload"/>
                  <NvButton icon-name="brackets-curly" size="sm" @click="openDevTools"/>
                </template>
              </div>
            </NvCard>
            <NvCard size="xs">
              <div class="inline-flex items-center space-x-2">
                <NvButton icon-name="question-circle" size="sm"/>
                <NvDivider class="h-3" direction="vertical"/>
                <NvButton icon-name="comment-alt-lines" size="sm"/>
                <NvDivider class="h-3" direction="vertical"/>
                <NvButton
                  icon-name="setting"
                  size="sm"
                  @click="navigateTo({ name: 'settings-overview' })"
                />
              </div>
            </NvCard>
            <NvCard class="inline-flex" size="sm">
              <div class="inline-flex space-x-2">
                <!-- <NvButton size="xs" type="plain" icon-name="minus"/>
                <NvButton size="xs" type="plain" icon-name="square-full"/> -->
                <NvButton icon-name="times" size="xs" type="plain" @click="hide"/>
              </div>
            </NvCard>
          </div>
        </div>

        <!-- Middle -->
        <div class="flex justify-between">
          <NvCard class="inline-flex items-center space-x-3" size="sm">
            <NvButton
              icon-name="setting"
              size="sm"
              @click="navigateTo({ name: 'settings-speech' })"
            />
            <NvDivider class="h-3" direction="vertical"/>
            <SpeechEngineSelect
              :modelValue="speechStore.selectedSpeechEngine"
              class="w-13"
              icon-name="direction"
              placeholder="Speech Engine"
              size="sm"
              @update:modelValue="
                (value) =>
                  settingsStore.$patch({ selectedSpeechEngine: value })
              "
            />
            <template v-if="speechStore.currentSpeechEngine">
              <component
                :is="speechStore.currentSpeechEngine.voiceSelectComponent"
                v-if="speechStore.currentSpeechEngine.voiceSelectComponent"
                class="w-13"
                placeholder="Speech Voice"
                size="sm"
              />
            </template>
            <NvDivider class="h-3" direction="vertical"/>
            <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
              <div class="w-screen max-w-full">
                <NvStack spacing="4">
                  <NvGroup justify="apart">
                    <NvText type="label">Play on default playback device</NvText>
                    <NvSwitch
                      :modelValue="
                        settingsStore.playSpeechOnDefaultPlaybackDevice
                      "
                      @update:modelValue="
                        (value) =>
                          settingsStore.$patch({
                            playSpeechOnDefaultPlaybackDevice: value,
                          })
                      "
                    />
                  </NvGroup>
                  <NvDivider direction="horizontal"/>
                  <NvFormItem label="Audio Outputs">
                    <NvAudioOutputsSelect class="w-full"/>
                  </NvFormItem>
                </NvStack>
              </div>
              <template #reference>
                <NvButton icon-name="direction" size="sm">Outputs</NvButton>
              </template>
            </NvPopover>
            <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
              <div class="w-screen max-w-full">
                <NvStack spacing="4">
                  <NvFormItem label="Audio Input">
                    <NvAudioInputsSelect class="w-full"/>
                  </NvFormItem>
                </NvStack>
              </div>
              <template #reference>
                <NvButton icon-name="direction" size="sm">Input</NvButton>
              </template>
            </NvPopover>
          </NvCard>
          <NvCard class="inline-flex items-center space-x-3" size="sm">
            <NvButton
              :type="settingsStore.messageMode === 'sentence' && 'plain'"
              size="sm"
              @click="settingsStore.$patch({ messageMode: 'sentence' })"
            >Sentence
            </NvButton>
            <NvButton
              :type="settingsStore.messageMode === 'word' && 'plain'"
              size="sm"
              @click="settingsStore.$patch({ messageMode: 'sentence' })"
            >Word
            </NvButton>
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
              @blur="messengerStore.$patch({isInputFocused: false})"
              @focus="messengerStore.$patch({isInputFocused: true})"
              @keydown.enter="playMessage()"
              @keydown.space="
                (e) =>
                  settingsStore.messageMode === 'word' && [
                    playMessage(),
                    e.preventDefault(),
                  ]
              "
            />
            <NvButton icon-name="message" size="lg" @click="playMessage()"/>
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
import { ComponentPublicInstance, computed, defineProps, onMounted, ref, watch } from 'vue'
import Moveable from 'vue3-moveable'
import {
  NvButton,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvPopover,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { RouteLocationRaw, useRouter } from 'vue-router'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import { useRouterViewPopover } from '@/features/router/hooks'
import SpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { emitIPCSay } from '@/electron/events/renderer'
import NvAudioOutputsSelect from '@/features/audio/components/inputs/NvAudioOutputsSelect.vue'
import NvAudioInputsSelect from '@/features/audio/components/inputs/NvAudioInputSelect.vue'
import { useMessengerStore } from '@/teams/messenger/store'
import { storeToRefs } from 'pinia'
import { useSettingsStore } from '@/features/settings/store'
import { useSpeechStore } from '@/features/speech/store'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()

const messengerStore = useMessengerStore()
const { position } = storeToRefs(messengerStore)
const { ElectronMessengerWindow } = window
const props = defineProps({
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

const moveable = ref()
const moveableTarget = ref()
const messengerInput = ref()

const inputValue = ref('')
const doc = document
const settingsPopover = useRouterViewPopover({
  popoverTarget: messenger,
  popoverOptions: {
    trigger: 'manual',
  },
})

const router = useRouter()
const navigateTo = (location: RouteLocationRaw) => {
  router.push(location)
  settingsPopover.popover.value?.show()
}

const viewport = computed(() => ({
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
}))

const savePosition = (event: any) => {
  const { width, height, translate, transform } = event
  messengerStore.$patch({
    position: {
      width,
      height,
      translate,
      transform,
    },
  })
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
    emitIPCSay(inputValue.value)
    inputValue.value = ''
  }
}

const onWindowFocus = () => {
  const componentInstance = messengerInput.value as ComponentPublicInstance
  const input = componentInstance.$el.querySelector('input')
  if (input) input.focus()
}

const onWindowBlur = () => {
  const componentInstance = messengerInput.value as ComponentPublicInstance
  const input = componentInstance.$el.querySelector('input')
  if (input) input.blur()
}

watch(
  () => messengerStore.isFocused,
  () => {
    if (messengerStore.isFocused) {
      onWindowFocus()
    } else {
      onWindowBlur()
    }
  },
)

onMounted(() => {
  const moveableTargetEl = (moveableTarget.value as ComponentPublicInstance)
    .$el as HTMLDivElement | null
  if (moveableTargetEl) {
    if (props.width) moveableTargetEl.style.width = `${ props.width }px`
    if (props.minWidth) moveableTargetEl.style.minWidth = `${ props.minWidth }px`
    if (props.maxWidth) moveableTargetEl.style.maxWidth = `${ props.maxWidth }px`
    if (props.height) moveableTargetEl.style.height = `${ props.height }px`
    if (props.minHeight) moveableTargetEl.style.minHeight = `${ props.minHeight }px`
    if (props.maxHeight) moveableTargetEl.style.maxHeight = `${ props.maxHeight }px`
    if (props.transform) moveableTargetEl.style.transform = props.transform
  }
  moveable.value.updateTarget()

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
