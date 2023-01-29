<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvButton
        :type="
          route.name === 'settings-engine' && messengerContext.isViewShown.value
            ? 'plain'
            : 'default'
        "
        icon-name="users-alt"
        size="sm"
        @click="messengerContext.navigateTo({ name: 'settings-engine' })"
      />
      <NvDivider class="h-3" direction="vertical" />
      <SpeechEngineSelect
        :modelValue="speechStore.selectedSpeechEngine"
        class="w-13"
        icon-name="direction"
        placeholder="Speech Engine"
        size="sm"
        @update:modelValue="(value) => settingsStore.$patch({ selectedSpeechEngine: value })"
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
      <NvDivider class="h-3" direction="vertical" />
      <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
        <div class="w-screen max-w-full">
          <NvStack spacing="4">
            <NvGroup justify="apart">
              <NvText type="label">Play on default playback device</NvText>
              <NvSwitch
                :modelValue="settingsStore.playSpeechOnDefaultPlaybackDevice"
                @update:modelValue="
                  (value) =>
                    settingsStore.$patch({
                      playSpeechOnDefaultPlaybackDevice: value,
                    })
                "
              />
            </NvGroup>
            <NvDivider direction="horizontal" />
            <NvFormItem label="Audio Outputs">
              <NvAudioOutputsSelect class="w-full" />
            </NvFormItem>
          </NvStack>
        </div>
        <template #reference>
          <NvButton icon-name="direction" size="sm"
            >Outputs ({{
              settingsStore.audioOutputs.length +
              (settingsStore.playSpeechOnDefaultPlaybackDevice ? 1 : 0)
            }})
          </NvButton>
        </template>
      </NvPopover>
      <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
        <div class="w-screen max-w-full">
          <NvStack spacing="4">
            <NvFormItem label="Audio Input">
              <NvAudioInputsSelect class="w-full" />
            </NvFormItem>
          </NvStack>
        </div>
        <template #reference>
          <NvButton icon-name="direction" size="sm">Input</NvButton>
        </template>
      </NvPopover>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvPopover,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import { useSettingsStore } from '@/features/settings/store'
import SpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import NvAudioOutputsSelect from '@/features/audio/components/inputs/NvAudioOutputsSelect.vue'
import NvAudioInputsSelect from '@/features/audio/components/inputs/NvAudioInputSelect.vue'

import { inject } from 'vue'
import { useRoute } from 'vue-router'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()
</script>
