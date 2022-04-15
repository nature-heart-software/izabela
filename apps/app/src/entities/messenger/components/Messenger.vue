<template>
  <div class="messengerWrapper">
    <dom-boundary ref="moveableTarget" id="moveable" class="inline-flex">
      <div
        ref="messenger"
        class="messenger bg-gray-10/90 rounded grid p-4 gap-4 grid-rows-3 grid-rows-none"
      >
        <!-- Top -->
        <div class="flex space-x-4">
          <nv-button type="plain" icon-name="info"/>
          <nv-card size="xs">
            <div class="inline-flex space-x-2">
              <nv-button size="sm" icon-name="github-alt"/>
              <nv-button size="sm" icon-name="twitter-alt"/>
              <nv-button size="sm" icon-name="discord"/>
            </div>
          </nv-card>
          <div class="flex flex-1 justify-end space-x-4 moveable-handle cursor-all-scroll">
            <nv-card size="xs" class="flex-1 min-h-8">
              <div class="inline-flex space-x-2">
                <template v-if="$store.state.env === 'development'">
                  <nv-button size="sm" icon-name="redo" @click="reload"/>
                  <nv-button size="sm" icon-name="brackets-curly" @click="openDevTools"/>
                </template>
              </div>
            </nv-card>
            <nv-card size="xs">
              <div class="inline-flex items-center space-x-2">
                <nv-button size="sm" icon-name="comment-alt-lines"/>
                <nv-divider direction="vertical" class="h-3"/>
                <nv-button size="sm" icon-name="setting"/>
              </div>
            </nv-card>
            <nv-card size="sm" class="inline-flex">
              <div class="inline-flex space-x-2">
                <!-- <nv-button size="xs" type="plain" icon-name="minus"/>
                <nv-button size="xs" type="plain" icon-name="square-full"/> -->
                <nv-button size="xs" type="plain" icon-name="times" @click="hide"/>
              </div>
            </nv-card>
          </div>
        </div>

        <!-- Middle -->
        <div class="flex justify-between">
          <nv-card size="sm" class="inline-flex items-center space-x-3">
            <span ref="settingsToggler">
              <nv-button size="sm" icon-name="setting"/>
            </span>
            <nv-divider direction="vertical" class="h-3"/>
            <nv-select
              class="w-13"
              v-model="api"
              size="sm"
              icon-name="direction"
              placeholder="TTS API"
            >
              <nv-option value="gctts" label="Google - Google Cloud TTS"/>
              <nv-option value="aptts" label="Polly - Amazon Polly"/>
              <nv-option value="matts" label="Azure - Microsoft azure TTS"/>
              <nv-option value="say" label="Say"/>
            </nv-select>
            <nv-select
              class="w-13"
              v-model="voice"
              size="sm"
              icon-name="direction"
              placeholder="API Voice"
            >
              <nv-option value="1" label="Voice 1"/>
              <nv-option value="2" label="Voice 2"/>
              <nv-option value="3" label="Voice 3"/>
            </nv-select>
            <nv-divider direction="vertical" class="h-3"/>
            <nv-button size="sm" icon-name="direction">Outputs</nv-button>
            <nv-button size="sm" icon-name="direction">Input</nv-button>
            <nv-divider direction="vertical" class="h-3"/>
            <nv-button size="sm" icon-name="question-circle"/>
          </nv-card>
          <nv-card size="sm" class="inline-flex items-center space-x-3">
            <nv-button size="sm" type="plain">Sentence</nv-button>
            <nv-button size="sm">Word</nv-button>
            <nv-divider direction="vertical" class="h-3"/>
            <nv-button size="sm" icon-name="question-circle"/>
          </nv-card>
        </div>

        <!-- Bottom -->
        <div>
          <nv-card size="sm" class="flex space-x-3">
            <nv-input
              ref="messengerInput"
              placeholder="So, said the angel to the child who, divided, broke the knife.."
              size="lg"
              class="w-full"
              v-model="inputValue"
              @keydown.enter="inputValue = ''"
            />
            <nv-button size="lg" icon-name="message" @click="inputValue = ''"/>
          </nv-card>
        </div>
      </div>
    </dom-boundary>
    <Moveable
      className="opacity-0"
      ref="moveable"
      target="#moveable"
      :dragTarget="document.querySelector('.moveable-handle')"
      :draggable="true"
      :scalable="false"
      :rotatable="false"
      :resizable="false"
      :snappable="true"
      :bounds="{
        left: 12,
        right: viewport.width - 12,
        top: 12,
        bottom: viewport.height - 12,
      }"
      :elementGuidelines="[document.querySelector('body')]"
      :verticalGuidelines="[viewport.width / 2]"
      :snapDirections="{
        center: true,
        middle: true,
      }"
      :snapThreshold="40"
      @drag="onDrag"
    />
  </div>
</template>
<script lang="ts">
import { ComponentPublicInstance, computed, defineComponent, ref } from 'vue'
import Moveable from 'vue3-moveable'
import { NvCard, NvButton, NvSelect, NvOption } from '@/core/components'
import DomBoundary from '@/modules/vue-dom-boundaries/DomBoundary.vue'
import NvDivider from '@/core/components/Divider/NvDivider.vue'
import NvInput from '@/core/components/Input/NvInput.vue'
import store from '@/store'
import { useSettingsPopover } from '@/entities/settings/hooks'

const { ElectronMessengerWindow } = window

export default defineComponent({
  name: 'NvMessenger',
  components: {
    DomBoundary,
    NvInput,
    NvDivider,
    NvCard,
    NvButton,
    NvSelect,
    NvOption,
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
    return {
      messenger,
      settingsToggler,
      settingsPopover,
      document,
      viewport,
      api: ref(''),
      voice: ref(''),
      inputValue: ref(''),
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
    }
  },
  mounted() {
    const moveableTargetEl = (this.$refs.moveableTarget as ComponentPublicInstance)
      .$el as HTMLDivElement | null
    const moveable = this.$refs.moveable as any
    if (moveableTargetEl) {
      if (this.width) moveableTargetEl.style.width = `${ this.width }px`
      if (this.minWidth) moveableTargetEl.style.minWidth = `${ this.minWidth }px`
      if (this.maxWidth) moveableTargetEl.style.maxWidth = `${ this.maxWidth }px`
      if (this.height) moveableTargetEl.style.height = `${ this.height }px`
      if (this.minHeight) moveableTargetEl.style.minHeight = `${ this.minHeight }px`
      if (this.maxHeight) moveableTargetEl.style.maxHeight = `${ this.maxHeight }px`
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
