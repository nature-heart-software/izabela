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
                <template
                  v-if="
                    settingsStore.selectedSpeechRecognitionEngine ===
                    'google-cloud'
                  "
                >
                  <NvDivider direction="horizontal" />
                  <NvGoogleCloudCredentialsFormPart>
                    Izabela uses Google Cloud Speech for speech recognition
                    which requires a
                    <a
                      href="https://github.com/nature-heart-software/izabela/wiki/How-to-get-Google-Cloud-service-account-credentials"
                      target="_blank"
                      >Google Cloud service account credentials</a
                    >
                    file to be imported
                  </NvGoogleCloudCredentialsFormPart>
                  <NvAccessBlocker
                    :allowed="!!googleCloudSpeechCredentialsPath"
                    reason="Google Cloud credentials required"
                  >
                    <NvStack :spacing="5">
                      <NvDivider direction="horizontal" />
                      <NvGroup justify="apart" no-wrap spacing="5">
                        <NvStack>
                          <NvText type="label">Filter profanities</NvText>
                        </NvStack>
                        <NvSwitch
                          :modelValue="settingsStore.speechProfanityFilter"
                          class="shrink-0"
                          @update:modelValue="
                            (value) =>
                              settingsStore.$patch({
                                speechProfanityFilter: value,
                              })
                          "
                        />
                      </NvGroup>
                    </NvStack>
                  </NvAccessBlocker>
                </template>
                <template v-if="settingsStore.selectedSpeechRecognitionEngine === 'elevenlabs'">
                  <NvDivider direction="horizontal" />
                  <NvFormItem label="API Key">
                    <NvInput
                      :modelValue="elevenlabsSpeechRecognitionPlugin.getProperty('apiKey', true)"
                      show-password
                      type="password"
                      @update:modelValue="(value) => elevenlabsSpeechRecognitionPlugin.setProperty('apiKey', value, true)"
                    />
                  </NvFormItem>
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
  NvGroup,
  NvStack,
  NvSwitch,
  NvText,
  NvFormItem,
  NvInput,
} from '@packages/ui'
import NvAudioInputFormPart from '@/features/audio/components/inputs/NvAudioInputFormPart.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechRecognitionEngineSelect from '@/features/speech/components/inputs/NvSpeechRecognitionEngineSelect.vue'
import NvGoogleCloudCredentialsFormPart from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import { elevenlabsSpeechRecognitionPlugin } from '@/features/speech/store/plugins/elevenlabs'

const settingsStore = useSettingsStore()
const { data: googleCloudSpeechCredentialsPath } =
  useGetGoogleCloudSpeechCredentialsPath()
</script>
