<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Audio input</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvStack>
            <NvGroup justify="apart">
              <NvGroup>
                <NvText type="label">Enable audio input</NvText>
                <NvText>(optional)</NvText>
              </NvGroup>
              <NvSwitch
                :modelValue="settingsStore.enableSTTTS"
                @update:modelValue="
                  (value) => {
                    settingsStore.$patch({
                      enableSTTTS: value,
                    })
                  }
                "
              />
            </NvGroup>
            <NvText
              >Generate audio using your voice (speech-to-text-to-speech)
            </NvText>
            <NvText type="caption"
              ><strong>NOTE:</strong> This might prevent your device from going
              to sleep
            </NvText>
          </NvStack>
        </NvCard>
        <div v-if="settingsStore.enableSTTTS" class="pl-8">
          <NvStack spacing="4">
            <NvCard>
              <NvStack spacing="5">
                <NvGroup align="start" justify="apart" no-wrap spacing="5">
                  <NvStack>
                    <NvText type="label">Speech recognition engine</NvText>
                    <NvText>Select the speech recognition engine to use</NvText>
                  </NvStack>
                  <NvSpeechRecognitionEngineSelect
                    :modelValue="settingsStore.selectedSpeechRecognitionEngine"
                    @update:modelValue="
                      (value) => {
                        settingsStore.$patch({
                          selectedSpeechRecognitionEngine: value,
                        })
                      }
                    "
                  />
                </NvGroup>
                <NvDivider direction="horizontal" />
                <template v-if="currentEngineSettingsComponent">
                  <component :is="currentEngineSettingsComponent" />
                </template>
              </NvStack>
            </NvCard>
            <NvCard>
              <NvAudioInputFormPart />
            </NvCard>
          </NvStack>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvAudioInputFormPart from '@/features/audio/components/inputs/NvAudioInputFormPart.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechRecognitionEngineSelect from '@/features/speech/components/inputs/NvSpeechRecognitionEngineSelect.vue'
import { computed } from 'vue'
import speechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'

const settingsStore = useSettingsStore()
const engine = computed(() => {
  return speechRecognitionEngineManager.getEngineById(
    settingsStore.selectedSpeechRecognitionEngine,
  )
})

const currentEngineSettingsComponent = computed(
  () => engine.value?.settingsComponent,
)
</script>
