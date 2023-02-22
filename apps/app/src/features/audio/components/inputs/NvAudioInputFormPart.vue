<template>
  <NvStack spacing="5">
    <NvGoogleCloudCredentialsFormPart>
      Izabela uses Google Cloud Speech for speech recognition which requires Google Cloud
      Credentials to be imported
    </NvGoogleCloudCredentialsFormPart>
    <template v-if="!!googleCloudSpeechCredentialsPath">
      <NvStack spacing="5">
        <NvDivider direction="horizontal" />
        <NvGroup justify="apart" no-wrap spacing="5">
          <NvStack>
            <NvText type="label">Enable speech-to-text-to-speech</NvText>
            <NvText type="caption">This might prevent your device from going to sleep</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="settingsStore.enableSTTTS"
            class="shrink-0"
            @update:modelValue="(value) => settingsStore.$patch({ enableSTTTS: value })"
          />
        </NvGroup>
        <template v-if="settingsStore.enableSTTTS">
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap>
            <NvText type="label"> Speech recognition language</NvText>
            <NvSpeechInputLanguageSelect />
          </NvGroup>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap>
            <NvText type="label"> Speech recognition strategy</NvText>
            <NvSpeechRecognitionStrategySelect />
          </NvGroup>
          <template
            v-if="['continuous-web', 'ptr'].includes(settingsStore.speechRecognitionStrategy)"
          >
            <NvDivider direction="horizontal" />
            <NvFormItem label="Audio Input">
              <NvAudioInputSelect />
            </NvFormItem>
            <template v-if="settingsStore.speechRecognitionStrategy === 'ptr'">
              <NvDivider direction="horizontal" />
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">Push-to-record Key</NvText>
                  <NvText>Key to press in order to record speech</NvText>
                  <NvText type="caption">Release the key to transcribe speech</NvText>
                </NvStack>
                <NvKeybinding
                  :modelValue="settingsStore.keybindings.recordAudio"
                  @update:modelValue="
                    (value) => settingsStore.$patch({ keybindings: { recordAudio: value } })
                  "
                />
              </NvGroup>
            </template>
            <template v-if="settingsStore.speechRecognitionStrategy === 'continuous-web'">
              <NvDivider direction="horizontal" />
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">Activation threshold</NvText>
                  <NvText>Minimum volume required to record speech (dB)</NvText>
                  <NvText type="caption">A lower value activates the recording more easily</NvText>
                </NvStack>
                <NvNumberInput
                  :modelValue="settingsStore.audioInputSensibility"
                  @update:modelValue="
                    (value) => settingsStore.$patch({ audioInputSensibility: value })
                  "
                />
              </NvGroup>
              <NvDivider direction="horizontal" />
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">Pre-recording time</NvText>
                  <NvText>Amount of time recorded before speech detection (ms)</NvText>
                  <NvText type="caption">This prevents words from being cut-off</NvText>
                </NvStack>
                <NvNumberInput
                  :min="100"
                  :modelValue="settingsStore.speechPrerecordTime"
                  @update:modelValue="
                    (value) => settingsStore.$patch({ speechPrerecordTime: value })
                  "
                />
              </NvGroup>
              <NvDivider direction="horizontal" />
              <NvGroup justify="apart" no-wrap spacing="5">
                <NvStack>
                  <NvText type="label">Post-recording time</NvText>
                  <NvText>Amount of silence required to start speech transcription (ms)</NvText>
                </NvStack>
                <NvNumberInput
                  :modelValue="settingsStore.speechPostrecordTime"
                  @update:modelValue="
                    (value) => settingsStore.$patch({ speechPostrecordTime: value })
                  "
                />
              </NvGroup>
            </template>
          </template>
          <template v-if="settingsStore.speechRecognitionStrategy === 'continuous-native'">
            <NvDivider direction="horizontal" />
            <NvGroup align="start" justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Recording device</NvText>
                <NvText>The index of the recording device you want to use</NvText>
              </NvStack>
              <NvNumberInput
                :min="0"
                :modelValue="settingsStore.soxDevice"
                @update:modelValue="(value) => settingsStore.$patch({ soxDevice: value })"
              />
            </NvGroup>
            <NvDivider direction="horizontal" />
            <NvGroup align="start" justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Restart speech recognition server</NvText>
                <NvText>Restart speech recognition server if it stops working</NvText>
              </NvStack>
              <NvButton @click="ElectronSpeechWorkerWindow.restartNativeSpeechRecognition()"
                >Restart
              </NvButton>
            </NvGroup>
            <!--        <NvGroup justify="apart" no-wrap spacing="5">-->
            <!--          <NvStack>-->
            <!--            <NvStack>-->
            <!--              <NvText type="label">Silence threshold</NvText>-->
            <!--              <NvText>Minimum volume required to record speech</NvText>-->
            <!--              <NvText type="caption">A lower value activates the recording more easily</NvText>-->
            <!--            </NvStack>-->
            <!--          </NvStack>-->
            <!--          <NvNumberInput-->
            <!--            :max="1"-->
            <!--            :min="0"-->
            <!--            :modelValue="settingsStore.soxThreshold"-->
            <!--            :step="0.01"-->
            <!--            @update:modelValue="-->
            <!--                  (value) => settingsStore.$patch({ soxThreshold: value })-->
            <!--                "-->
            <!--          />-->
            <!--        </NvGroup>-->
            <!--        <NvDivider direction="horizontal"/>-->
            <!--        <NvGroup justify="apart" no-wrap spacing="5">-->
            <!--          <NvStack>-->
            <!--            <NvStack>-->
            <!--              <NvText type="label">Post-recording time</NvText>-->
            <!--              <NvText>Amount of silence required to start speech transcription (ms)</NvText>-->
            <!--            </NvStack>-->
            <!--          </NvStack>-->
            <!--          <NvNumberInput-->
            <!--            :modelValue="settingsStore.soxSilence"-->
            <!--            @update:modelValue="-->
            <!--                  (value) => settingsStore.$patch({ soxSilence: value })-->
            <!--                "-->
            <!--          />-->
            <!--        </NvGroup>-->
          </template>
        </template>
      </NvStack>
    </template>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvNumberInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import NvAudioInputSelect from '@/features/audio/components/inputs/NvAudioInputSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechRecognitionStrategySelect from '@/features/speech/components/inputs/NvSpeechRecognitionStrategySelect.vue'

import NvGoogleCloudCredentialsFormPart from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import NvSpeechInputLanguageSelect from '@/features/speech/components/inputs/NvSpeechInputLanguageSelect.vue'

const settingsStore = useSettingsStore()

const { ElectronSpeechWorkerWindow } = window

const { data: googleCloudSpeechCredentialsPath } = useGetGoogleCloudSpeechCredentialsPath()
</script>
