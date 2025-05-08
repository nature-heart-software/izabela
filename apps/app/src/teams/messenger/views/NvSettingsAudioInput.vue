<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Audio input</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvStack>
            <NvText type="label">Audio input</NvText>
            <NvText
              >Generate audio using your voice (speech-to-text-to-speech)
            </NvText>
            <NvText type="caption"
              ><strong>NOTE:</strong> This might prevent your device from going
              to sleep
            </NvText>
          </NvStack>
        </NvCard>
        <div class="pl-8">
          <NvStack spacing="4">
            <NvCard>
              <NvStack spacing="5">
                <NvGroup justify="apart" no-wrap>
                  <NvStack>
                    <NvText type="label">Enable audio input</NvText>
                  </NvStack>
                  <NvSwitch
                    class="shrink-0"
                    :modelValue="settingsStore.enableSTTTS"
                    @update:modelValue="
                      (value) => settingsStore.$patch({ enableSTTTS: value })
                    "
                  />
                </NvGroup>
                <NvDivider direction="horizontal" />
                <NvAccessBlocker
                  :allowed="settingsStore.enableSTTTS"
                  :reason="'Audio input needs to be enabled'"
                >
                  <NvStack spacing="5">
                    <NvFormItem label="Speech recognition engine">
                      <NvSpeechRecognitionEngineSelect
                        :modelValue="
                          settingsStore.selectedSpeechRecognitionEngine
                        "
                        @update:modelValue="
                          (value) => {
                            settingsStore.$patch({
                              selectedSpeechRecognitionEngine: value,
                            })
                          }
                        "
                      />
                    </NvFormItem>
                    <template v-if="currentEngineSettingsComponent">
                      <NvDivider direction="horizontal" />
                      <component :is="currentEngineSettingsComponent" />
                    </template>
                  </NvStack>
                </NvAccessBlocker>
              </NvStack>
            </NvCard>
            <NvCard>
              <NvAccessBlocker
                :allowed="
                  settingsStore.enableSTTTS
                    ? engine
                      ? engine.hasCredentials()
                      : true
                    : false
                "
                :reason="
                  settingsStore.enableSTTTS
                    ? 'Credentials required'
                    : 'Audio input needs to be enabled'
                "
              >
                <NvAudioInputFormPart />
              </NvAccessBlocker>
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
