<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvTooltip>
        <NvText>Speech settings</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name === 'settings-engine' && messengerContext.isViewShown.value
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
            size="sm"
            @update:modelValue="(value) => settingsStore.$patch({ selectedSpeechEngine: value })"
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
              size="sm"
            />
          </template>
        </NvTooltip>
      </template>
      <NvDivider class="h-3" direction="vertical" />
      <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
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
              <NvButton data-v-step="audio-outputs-select" icon-name="direction" size="sm"
                >Outputs ({{
                  settingsStore.audioOutputs.length +
                  (settingsStore.playSpeechOnDefaultPlaybackDevice ? 1 : 0)
                }})
              </NvButton>
            </template>
          </NvTooltip>
        </template>
      </NvPopover>
      <NvPopover :tippy-options="{ placement: 'top-start' }" size="sm">
        <div class="w-screen max-w-full">
          <NvStack spacing="4">
            <NvGroup justify="apart" no-wrap>
              <NvStack>
                <NvText type="label">Enable speech-to-text-to-speech</NvText>
              </NvStack>
              <NvSwitch
                :modelValue="settingsStore.enableSTTTS"
                class="shrink-0"
                @update:modelValue="(value) => settingsStore.$patch({ enableSTTTS: value })"
              />
            </NvGroup>
            <NvAccessBlocker
              :allowed="!!googleCloudSpeechCredentialsPath && settingsStore.enableSTTTS"
              :reason="
                settingsStore.enableSTTTS
                  ? 'Google Cloud Credentials required'
                  : 'STTTS needs to be enabled'
              "
            >
              <NvStack spacing="4">
                <NvDivider direction="horizontal" />
                <NvFormItem label="Speech recognition language">
                  <NvSpeechInputLanguageSelect />
                </NvFormItem>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Speech recognition strategy">
                  <NvSpeechRecognitionStrategySelect />
                </NvFormItem>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Audio input">
                  <template
                    v-if="
                      ['continuous-web', 'ptr'].includes(settingsStore.speechRecognitionStrategy)
                    "
                  >
                    <NvAudioInputsSelect class="w-full" />
                  </template>
                  <template
                    v-if="['continuous-native'].includes(settingsStore.speechRecognitionStrategy)"
                  >
                    <NvSoxAudioInputSelect class="!w-full" />
                  </template>
                </NvFormItem>
              </NvStack>
            </NvAccessBlocker>
          </NvStack>
        </div>
        <template #reference>
          <NvTooltip>
            <NvText>Audio input</NvText>
            <template #reference>
              <NvButton data-v-step="audio-input-select" icon-name="direction" size="sm"
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
  NvAccessBlocker,
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
import NvAudioInputsSelect from '@/features/audio/components/inputs/NvAudioInputSelect.vue'
import NvSoxAudioInputSelect from '@/features/audio/components/inputs/NvSoxAudioInputSelect.vue'
import NvSpeechInputLanguageSelect from '@/features/speech/components/inputs/NvSpeechInputLanguageSelect.vue'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import NvSpeechRecognitionStrategySelect from '@/features/speech/components/inputs/NvSpeechRecognitionStrategySelect.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'

const speechStore = useSpeechStore()
const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()
const { data: googleCloudSpeechCredentialsPath } = useGetGoogleCloudSpeechCredentialsPath()
</script>
