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
        <template v-if="messagesStore.shortcutMessages.length === 0">
          <NvCard>
            <NvCenter>
              <NvText>No shortcuts</NvText>
            </NvCenter>
          </NvCard>
        </template>
        <template v-for="{ id } in messagesStore.shortcutMessages" :key="id">
          <NvShortcutMessage :id="id"/>
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvCenter, NvGroup, NvStack, NvText } from '@packages/ui'
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
