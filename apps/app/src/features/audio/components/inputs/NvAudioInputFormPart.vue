<template>
  <NvStack spacing="5">
    <NvGoogleCloudCredentialsFormPart>
      Izabela uses Google Cloud Speech for speech recognition which requires a
      <a
        href="https://developers.google.com/workspace/guides/create-credentials#service-account"
        target="_blank"
        >Google Cloud service account credentials</a
      >
      file to be imported
    </NvGoogleCloudCredentialsFormPart>
    <template v-if="!!googleCloudSpeechCredentialsPath">
      <NvStack spacing="5">
        <NvDivider direction="horizontal" />
        <NvGroup align="start" justify="apart" no-wrap spacing="5">
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
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap>
            <NvStack>
              <NvText type="label">Recording device</NvText>
            </NvStack>
            <NvSoxAudioInputSelect />
          </NvGroup>
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
          <template v-if="settingsStore.speechRecognitionStrategy === 'continuous'">
            <NvDivider direction="horizontal" />
            <NvStack>
              <NvGroup align="start" justify="apart" noWrap spacing="5">
                <NvStack>
                  <NvText type="label">Activation threshold</NvText>
                  <NvText>Minimum volume required to record speech (dB)</NvText>
                  <NvText type="caption">A lower value activates the recording more easily</NvText>
                </NvStack>
                <NvNumberInput
                  :max="0"
                  :min="minMeterValue"
                  :modelValue="settingsStore.audioInputSensibility"
                  @update:modelValue="
                    (value) => settingsStore.$patch({ audioInputSensibility: value })
                  "
                />
              </NvGroup>
              <NvStack>
                <NvGroup
                  :style="{
                    marginTop: rem(tokens.spacing['2']),
                    paddingTop: rem(tokens.spacing['5']),
                  }"
                  align="start"
                  justify="apart"
                  noWrap
                  spacing="1"
                >
                  <template
                    v-for="(_, i) in Array(Math.abs(minMeterValue) + 1).fill(null)"
                    :key="i"
                  >
                    <div
                      :style="{
                        backgroundColor: tokens.colors.gray['90'],
                        height: i % 5 ? rem(tokens.spacing['1']) : rem(tokens.spacing['3']),
                        width: rem(tokens.spacing['1']),
                        position: 'relative',
                      }"
                    >
                      <div
                        v-if="!(i % 5)"
                        :style="{
                          position: 'absolute',
                          top: rem(-tokens.spacing['1']),
                          left: '50%',
                          transform: 'translate(-50%, -100%)',
                        }"
                      >
                        <NvText type="caption">{{ i + minMeterValue }}</NvText>
                      </div>
                    </div>
                  </template>
                </NvGroup>
                <div
                  :style="{
                    backgroundColor: tokens.colors.gray['10'],
                    height: rem(tokens.spacing['2']),
                    position: 'relative',
                  }"
                >
                  <div
                    :style="{
                      backgroundColor: tokens.colors.gray['90'],
                      height: rem(tokens.spacing['2']),
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: `${micVolumeBarWidth}%`,
                    }"
                  />
                  <div
                    :style="{
                      backgroundColor: tokens.colors.gray['90'],
                      height: rem(tokens.spacing['5']),
                      position: 'absolute',
                      top: '50%',
                      left: `${currentVolumeBarPosition}%`,
                      width: rem(tokens.spacing['1']),
                      transform: 'translate(-50%, -50%)',
                    }"
                  />
                </div>
              </NvStack>
            </NvStack>
            <NvDivider direction="horizontal" />
            <NvGroup align="start" justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Speech recognition polling</NvText>
                <NvText
                  >How frequently the audio analyser checks if speech has started or stopped (ms)
                </NvText>
              </NvStack>
              <NvNumberInput
                :modelValue="settingsStore.speechDetectionPolling"
                @update:modelValue="
                  (value) => settingsStore.$patch({ speechDetectionPolling: value })
                "
              />
            </NvGroup>
            <NvDivider direction="horizontal" />
            <NvGroup align="start" justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Pre-recording samples</NvText>
                <NvText>How many audio samples to record before speech has started</NvText>
                <NvText type="caption"
                  >Increase if start of sentences are not properly detected
                </NvText>
              </NvStack>
              <NvNumberInput
                :min="3"
                :modelValue="settingsStore.soxPreRecordingChunks"
                @update:modelValue="
                  (value) => settingsStore.$patch({ soxPreRecordingChunks: value })
                "
              />
            </NvGroup>
            <NvDivider direction="horizontal" />
            <NvGroup align="start" justify="apart" no-wrap spacing="5">
              <NvStack>
                <NvText type="label">Post-recording samples</NvText>
                <NvText>How many audio samples to record after speech has stopped</NvText>
                <NvText type="caption"
                  >Increase if end of sentences are not properly detected
                </NvText>
              </NvStack>
              <NvNumberInput
                :min="3"
                :modelValue="settingsStore.soxPostRecordingChunks"
                @update:modelValue="
                  (value) => settingsStore.$patch({ soxPostRecordingChunks: value })
                "
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
          </template>
          <NvDivider direction="horizontal" />
          <NvGroup justify="apart" no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Filter profanities</NvText>
            </NvStack>
            <NvSwitch
              :modelValue="settingsStore.speechProfanityFilter"
              class="shrink-0"
              @update:modelValue="(value) => settingsStore.$patch({ speechProfanityFilter: value })"
            />
          </NvGroup>
        </template>
      </NvStack>
    </template>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvDivider,
  NvGroup,
  NvNumberInput,
  NvStack,
  NvSwitch,
  NvText,
  tokens,
} from '@packages/ui'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechRecognitionStrategySelect from '@/features/speech/components/inputs/NvSpeechRecognitionStrategySelect.vue'

import NvGoogleCloudCredentialsFormPart from '@/features/settings/components/NvGoogleCloudCredentialsFormPart.vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'
import NvSpeechInputLanguageSelect from '@/features/speech/components/inputs/NvSpeechInputLanguageSelect.vue'
import { rem } from 'polished'
import * as Tone from 'tone'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import NvSoxAudioInputSelect from '@/features/audio/components/inputs/NvSoxAudioInputSelect.vue'
import { useDevicesList } from '@vueuse/core'
import { soxMediaInputsFilter } from '@/utils/media-devices'

const minMeterValue = -80
const micVolume = ref(minMeterValue)
const settingsStore = useSettingsStore()
const { audioInputs } = useDevicesList()
const soxAudioInputs = computed(() => soxMediaInputsFilter(audioInputs.value))
const soxAudioInput = computed(() => soxAudioInputs.value[settingsStore.soxDevice])
const meter = new Tone.Meter()
let mic = new Tone.UserMedia()
const currentVolumeBarPosition = computed(
  () => 100 - Math.abs((settingsStore.audioInputSensibility / minMeterValue) * 100),
)
const micVolumeBarWidth = computed(() => Math.abs(minMeterValue - micVolume.value))
let interval: any = null
watch(
  () => [settingsStore.soxDevice, soxAudioInput],
  () => {
    mic.close()
    mic = new Tone.UserMedia()
    mic.open(soxAudioInput.value?.label)
    mic.connect(meter)
    interval = setInterval(() => {
      micVolume.value = meter.getValue() as number
    }, 100)
  },
  { immediate: true, deep: true },
)
onBeforeUnmount(() => {
  mic.close()
  if (interval) clearInterval(interval)
})

const { ElectronSpeechWorkerWindow } = window

const { data: googleCloudSpeechCredentialsPath } = useGetGoogleCloudSpeechCredentialsPath()
</script>
