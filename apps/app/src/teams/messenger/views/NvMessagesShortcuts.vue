<template>
  <NvStack spacing="6">
    <NvStack>
      <NvGroup justify="between">
        <NvText type="subtitle">Shortcuts</NvText>
      </NvGroup>
      <NvStack spacing="4">
        <div>
          <NvButton size="sm" @click="addShortcut">Add shortcut</NvButton>
        </div>
        <template v-for="({ id }, i) in messagesStore.shortcutMessages" :key="`${i}-${id}`">
          <NvShortcutMessage :id="id"/>
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvButton, NvGroup, NvStack, NvText } from '@packages/ui'
import { useMessagesStore } from '@/features/messages/store'
import { v4 as uuid } from 'uuid'
import NvShortcutMessage from '@/teams/messenger/components/NvShortcutMessage.vue'
import { useSpeechStore } from '@/features/speech/store'

const messagesStore = useMessagesStore()
const speechStore = useSpeechStore()
const addShortcut = () =>
  speechStore.currentSpeechEngine &&
  messagesStore.addShortcutMessage({
    id: uuid(),
    engine: speechStore.currentSpeechEngine.id,
    voice: speechStore.currentSpeechEngine.getSelectedVoice(),
    message: '',
    shortcut: [],
  })
</script>
