<template>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvButton icon-name="question-circle" size="sm" />
      <NvDivider class="h-3" direction="vertical" />
      <NvButton icon-name="comment-alt-lines" size="sm" />
      <NvDivider class="h-3" direction="vertical" />
      <NvButton
        icon-name="setting"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'settings-overview' })"
      />
    </NvGroup>
  </NvCard>
  <NvCard size="sm">
    <NvGroup :spacing="2">
      <NvButton icon-name="times" size="xs" type="plain" @click="hide" />
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvDivider, NvGroup } from '@packages/ui'
import { inject } from 'vue'

const messengerContext = inject('messenger')
const { ElectronMessengerWindow } = window

const hide = () => {
  ElectronMessengerWindow.hide()
}
</script>
