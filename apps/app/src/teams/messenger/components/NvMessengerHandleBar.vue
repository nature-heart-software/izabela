<template>
  <NvCard
    class="h-7"
    data-v-step="handle-bar"
    size="xs"
    @mousedown="dragging = true"
  >
    <NvGroup :spacing="2" justify="between">
      <NvGroup :spacing="2" noWrap>
        <template v-if="settingsStore.debugMode">
          <NvTooltip>
            <NvText>Reload page</NvText>
            <template #reference>
              <NvButton icon-name="redo" size="sm" @click="reload" />
            </template>
          </NvTooltip>
          <NvTooltip>
            <NvText>Open console</NvText>
            <template #reference>
              <NvButton
                icon-name="brackets-curly"
                size="sm"
                @click="openDevTools"
              />
            </template>
          </NvTooltip>
        </template>
      </NvGroup>
      <template v-if="messengerStateStore.markForRestart && !isGameOverlay">
        <NvMarkForRestartMessage />
      </template>
    </NvGroup>
  </NvCard>
  <Teleport to="body">
    <NvHitbox v-if="dragging" class="absolute inset-0 z-[-1]" />
  </Teleport>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { useMessengerStateStore } from '@/teams/messenger/store'
import NvMarkForRestartMessage from '@/teams/messenger/components/NvMarkForRestartMessage.vue'
import { isGameOverlay } from '@/consts.ts'
import NvHitbox from '@/modules/vue-hitboxes/NvHitbox.vue'
import { ref } from 'vue'
import { useEventListener } from '@vueuse/core'

const dragging = ref(false)
useEventListener('mouseup', () => {
  dragging.value = false
})
const settingsStore = useSettingsStore()
const { ElectronMessengerWindow } = window
const openDevTools = () => {
  ElectronMessengerWindow.openDevTools()
}

const reload = () => {
  window.location.reload()
}
const messengerStateStore = useMessengerStateStore()
</script>
