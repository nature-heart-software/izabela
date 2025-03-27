<template>
  <NvCard class="h-7" data-v-step="handle-bar" size="xs">
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
      <template
        v-if="
          messengerStateStore.markForRestart &&
          !isGameOverlay &&
          !info?.isRunningAsAdmin
        "
      >
        <NvMarkForRestartMessage />
      </template>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { useMessengerStateStore } from '@/teams/messenger/store'
import NvMarkForRestartMessage from '@/teams/messenger/components/NvMarkForRestartMessage.vue'
import { isGameOverlay } from '@/consts.ts'
import { useGetAppInfoQuery } from '@/features/app/queries.ts'

const settingsStore = useSettingsStore()
const { ElectronMessengerWindow } = window
const openDevTools = () => {
  ElectronMessengerWindow.openDevTools()
}

const reload = () => {
  window.location.reload()
}
const messengerStateStore = useMessengerStateStore()

const { data: info } = useGetAppInfoQuery()
</script>
