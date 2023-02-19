<template>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvTooltip>
        <NvText>Guided tour</NvText>
        <template #reference>
          <NvButton icon-name="question-circle" size="sm"/>
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Messages</NvText>
        <template #reference>
          <NvButton
            :type="
          route.name?.startsWith('messages') && messengerContext.isViewShown.value
            ? 'plain'
            : 'default'
        "
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
          route.name?.startsWith('settings') && messengerContext.isViewShown.value
            ? 'plain'
            : 'default'
        "
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
          <NvButton icon-name="times" size="xs" type="plain" @click="hide"/>
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
import { inject } from 'vue'
import { useRoute } from 'vue-router'

const messengerContext = inject('messenger')
const { ElectronMessengerWindow } = window
const route = useRoute()

const hide = () => {
  ElectronMessengerWindow.hide()
}
</script>
