<template>
  <div class="messengerWrapper">
    <dom-boundary id="moveable" ref="moveableTarget" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/90 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none"
      >
        <!-- Top -->
        <div class="flex space-x-4">
          <nv-button icon-name="info" type="plain" />
          <nv-card size="xs">
            <div class="inline-flex space-x-2">
              <nv-button icon-name="github-alt" size="sm" />
              <nv-button icon-name="twitter-alt" size="sm" />
              <nv-button icon-name="discord" size="sm" />
            </div>
          </nv-card>
          <div class="flex flex-1 justify-end space-x-4 moveable-handle cursor-all-scroll">
            <nv-card class="flex-1 min-h-8" size="xs">
              <div class="inline-flex space-x-2">
                <template v-if="$store.state.env === 'development'">
                  <nv-button icon-name="redo" size="sm" @click="reload" />
                  <nv-button icon-name="brackets-curly" size="sm" @click="openDevTools" />
                </template>
              </div>
            </nv-card>
            <nv-card size="xs">
              <div class="inline-flex items-center space-x-2">
                <nv-button icon-name="comment-alt-lines" size="sm" />
                <nv-divider class="h-3" direction="vertical" />
                <nv-button icon-name="setting" size="sm" />
              </div>
            </nv-card>
            <nv-card class="inline-flex" size="sm">
              <div class="inline-flex space-x-2">
                <!-- <nv-button size="xs" type="plain" icon-name="minus"/>
                <nv-button size="xs" type="plain" icon-name="square-full"/> -->
                <nv-button icon-name="times" size="xs" type="plain" @click="hide" />
              </div>
            </nv-card>
          </div>
        </div>

        <!-- Middle -->
        <div class="flex justify-between">
          <nv-card class="inline-flex items-center space-x-3" size="sm">
            <span ref="settingsToggler">
              <nv-button icon-name="setting" size="sm" />
            </span>
            <nv-divider class="h-3" direction="vertical" />
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
                icon-name="direction"
                placeholder="Speech Voice"
                size="sm"
                @update:modelValue="
                  (value) =>
                    $store.dispatch('settings/setProperty', ['persisted.GCTTSSelectedVoice', value])
                "
              />
            </template>
            <nv-divider class="h-3" direction="vertical" />
            <nv-button icon-name="direction" size="sm">Outputs</nv-button>
            <nv-button icon-name="direction" size="sm">Input</nv-button>
            <nv-divider class="h-3" direction="vertical" />
            <nv-button icon-name="question-circle" size="sm" />
          </nv-card>
          <nv-card class="inline-flex items-center space-x-3" size="sm">
            <nv-button size="sm" type="plain">Sentence</nv-button>
            <nv-button size="sm">Word</nv-button>
            <nv-divider class="h-3" direction="vertical" />
            <nv-button icon-name="question-circle" size="sm" />
          </nv-card>
        </div>

        <!-- Bottom -->
        <div>
          <nv-card class="flex space-x-3" size="sm">
            <nv-input
              ref="messengerInput"
              v-model="inputValue"
              class="w-full"
              placeholder="So, said the angel to the child who, divided, broke the knife.."
              size="lg"
              @keydown.enter="playMessage()"
            />
            <nv-button icon-name="message" size="lg" @click="playMessage()" />
          </nv-card>
        </div>
      </div>
    </dom-boundary>
    <Moveable
      ref="moveable"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :dragTarget="document.querySelector('.moveable-handle')"
      :draggable="true"
      :elementGuidelines="[document.querySelector('body')]"
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
<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, ref } from 'vue'
import Moveable from 'vue3-moveable'
import { NvButton, NvCard } from '@/core/components'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import NvDivider from '@/core/components/Divider/NvDivider.vue'
import NvInput from '@/core/components/Input/NvInput.vue'
import store from '@/store'
import { useSettingsPopover } from '@/entities/settings/hooks'
import SpeechEngineSelect from '@/entities/speech/components/inputs/SpeechEngineSelect.vue'
import GCTTSVoiceSelect from '@/entities/speech/components/inputs/GCTTSVoiceSelect.vue'
import izabela from '@/modules/izabela'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'

const { ElectronMessengerWindow } = window

export default defineComponent({
  name: 'NvMessenger',
  components: {
    GCTTSVoiceSelect,
    SpeechEngineSelect,
    DomBoundary,
    NvInput,
    NvDivider,
    NvCard,
    NvButton,
    Moveable,
  },
  props: {
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
  },
  setup() {
    const messenger = ref()
    const settingsToggler = ref()

    const { popover: settingsPopover } = useSettingsPopover({
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
    const inputValue = ref('')
    return {
      messenger,
      settingsToggler,
      settingsPopover,
      document,
      viewport,
      api: ref(''),
      voice: ref(''),
      inputValue,
      openDevTools() {
        ElectronMessengerWindow.openDevTools()
      },
      hide() {
        ElectronMessengerWindow.hide()
      },
      reload() {
        window.location.reload()
      },
      onDrag(event: any) {
        const { target, transform } = event
        target.style.transform = transform
        savePosition(event)
      },

      playMessage() {
        if (inputValue.value) {
          const engine = speechEngineManager.getEngineById(
            store.getters['settings/persisted'].selectedSpeechEngine,
          )
          if (!engine) return
          izabela.say({
            engine: engine.id,
            credentials: engine.getCredentials(),
            payload: engine.getPayload(inputValue.value),
          })
          inputValue.value = ''
        }
      },
    }
  },
  mounted() {
    const moveableTargetEl = (this.$refs.moveableTarget as ComponentPublicInstance)
      .$el as HTMLDivElement | null
    const moveable = this.$refs.moveable as any
    if (moveableTargetEl) {
      if (this.width) moveableTargetEl.style.width = `${this.width}px`
      if (this.minWidth) moveableTargetEl.style.minWidth = `${this.minWidth}px`
      if (this.maxWidth) moveableTargetEl.style.maxWidth = `${this.maxWidth}px`
      if (this.height) moveableTargetEl.style.height = `${this.height}px`
      if (this.minHeight) moveableTargetEl.style.minHeight = `${this.minHeight}px`
      if (this.maxHeight) moveableTargetEl.style.maxHeight = `${this.maxHeight}px`
      if (this.transform) moveableTargetEl.style.transform = this.transform
    }
    moveable.updateTarget()
    this.addEventListeners()

    /* This fixes focus on focusable elements. Focus won't work unless
     * the window has been dragged once with draggable for some reasons
     * */
    moveable.request('draggable', { deltaX: -1, deltaY: -1 }, true)
    moveable.request('draggable', { deltaX: 1, deltaY: 1 }, true)
  },
  methods: {
    onWindowFocus() {
      const componentInstance = this.$refs.messengerInput as ComponentPublicInstance
      const input = componentInstance.$el.querySelector('input')
      if (input) input.focus()
    },
    onWindowBlur() {
      const componentInstance = this.$refs.messengerInput as ComponentPublicInstance
      const input = componentInstance.$el.querySelector('input')
      if (input) input.blur()
    },
    addEventListeners() {
      const { ipc } = window
      ipc.on('main', 'focus', this.onWindowFocus)
      ipc.on('main', 'blur', this.onWindowBlur)
    },
    // removeEventListeners() {
    // },
  },
  // beforeUnmount() {
  //   this.removeEventListeners()
  // },
})
</script>
<style lang="scss" scoped>
.messenger {
  min-width: 768px;
}
</style>
