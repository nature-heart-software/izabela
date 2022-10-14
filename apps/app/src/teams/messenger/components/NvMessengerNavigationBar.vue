<template>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvButton icon-name="question-circle" size="sm"/>
      <NvButton
        :type="route.name.startsWith('messages') && messengerContext.isViewShown.value  ?  'plain'  :  'default'"
        icon-name="comment-alt-lines"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'messages-history' })"
      />
      <NvButton
        :type="route.name.startsWith('settings') && messengerContext.isViewShown.value  ?  'plain'  :  'default'"
        icon-name="setting"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'settings-overview' })"
      />
    </NvGroup>
  </NvCard>
  <NvCard size="sm">
    <NvGroup :spacing="2">
      <NvButton icon-name="times" size="xs" type="plain" @click="hide"/>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup } from '@packages/ui'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const messengerContext = inject('messenger')
const { ElectronMessengerWindow } = window
const route = useRoute()

const hide = () => {
  ElectronMessengerWindow.hide()
}
</script>
