<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvTooltip>
        <NvText>Speech settings</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name === 'settings-engine' &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="speech-settings-button"
            icon-name="users-alt"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'settings-engine' })"
          />
        </template>
      </NvTooltip>
      <NvDivider class="h-3" direction="vertical" />
      <NvTooltip>
        <NvText>Speech engine</NvText>
        <template #reference>
          <SpeechEngineSelect
            :modelValue="speechStore.selectedSpeechEngine"
            class="w-13"
            data-v-step="engine-select"
            icon-name="direction"
            placeholder="Speech Engine"
            placement="top-start"
            size="sm"
            @update:modelValue="
              (value) => settingsStore.$patch({ selectedSpeechEngine: value })
            "
          />
        </template>
      </NvTooltip>
      <template v-if="speechStore.currentSpeechEngine">
        <NvTooltip>
          <NvText>Speech engine voice</NvText>
          <template #reference>
            <component
              :is="speechStore.currentSpeechEngine.voiceSelectComponent"
              v-if="speechStore.currentSpeechEngine.voiceSelectComponent"
              class="w-13"
              data-v-step="engine-voice-select"
              placeholder="Speech Voice"
              placement="top-start"
              size="sm"
            />
          </template>
        </NvTooltip>
      </template>
      <NvDivider class="h-3" direction="vertical" />
      <NvPopover placement="top-start" size="sm">
        <div class="w-screen max-w-full">
          <NvStack spacing="4">
            <NvGroup justify="apart" no-wrap>
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
            <NvFormItem label="Audio outputs">
              <NvAudioOutputsSelect class="w-full" />
            </NvFormItem>
          </NvStack>
        </div>
        <template #reference>
          <NvTooltip>
            <NvText>Audio outputs</NvText>
            <template #reference>
              <NvButton
                data-v-step="audio-outputs-select"
                icon-name="direction"
                size="sm"
                >Outputs ({{
                  audioOutputs.filter((audioOutput) => settingsStore.audioOutputs.includes(audioOutput.label)).length +
                  (settingsStore.playSpeechOnDefaultPlaybackDevice ? 1 : 0)
                }})
              </NvButton>
            </template>
          </NvTooltip>
        </template>
      </NvPopover>
      <NvPopover placement="top-start" size="sm">
        <div class="w-screen max-w-full">
          <NvAudioInputForm size="sm" />
        </div>
        <template #reference>
          <NvTooltip>
            <NvText
              >Audio input
              <template v-if="settingsStore.enableSTTTS"> - Running</template>
            </NvText>
            <template #reference>
              <NvButton
                :type="settingsStore.enableSTTTS ? 'active' : 'default'"
                data-v-step="audio-input-select"
                icon-name="direction"
                size="sm"
                @click.middle.prevent.stop="toggleSTTTS"
                @click.right.prevent.stop="toggleSTTTS"
                @click.ctrl.prevent.stop="toggleSTTTS"
                >Input
              </NvButton>
            </template>
          </NvTooltip>
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
  NvTooltip,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import { useSettingsStore } from '@/features/settings/store'
import SpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import NvAudioOutputsSelect from '@/features/audio/components/inputs/NvAudioOutputsSelect.vue'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import NvAudioInputForm from '@/features/speech/components/forms/NvAudioInputForm.vue'
import { useDevicesList } from '@vueuse/core'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()

const { audioOutputs } = useDevicesList()

function toggleSTTTS() {
  settingsStore.$patch({
    enableSTTTS: !settingsStore.enableSTTTS,
  })
}
</script>
