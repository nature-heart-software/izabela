<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Speech</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup no-wrap spacing="5">
            <NvStack>
              <NvText type="label">Speech Engine</NvText>
              <NvText>Select the speech engine used for Izabela's speech</NvText>
            </NvStack>
            <SpeechEngineSelect
              :modelValue="$store.getters['settings/persisted'].selectedSpeechEngine"
              @update:modelValue="
                (value) => {
                  selectedEngineTab = value
                  $store.dispatch('settings/setProperty', ['persisted.selectedSpeechEngine', value])
                }
              "
            />
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvGroup grow>
                <template v-for="engine in speechEngines" :key="engine.id">
                  <NvButton
                    :selected="selectedEngineTab === engine.id"
                    align="center"
                    type="ghost"
                    @click="selectedEngineTab = engine.id"
                    >{{ engine.name }}
                  </NvButton>
                </template>
              </NvGroup>
              <NvDivider direction="horizontal" />
              <template v-if="selectedEngineTab === 'gctts'">
                <NvStack spacing="5">
                  <NvFormItem label="API Key">
                    <NvInput
                      :modelValue="decrypt($store.getters['settings/persisted'].GCTTSApiKey)"
                      show-password
                      type="password"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', [
                            'persisted.GCTTSApiKey',
                            encrypt(value),
                          ])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Voice">
                  <GCTTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].GCTTSSelectedVoice"
                    @update:modelValue="
                      (value) =>
                        $store.dispatch('settings/setProperty', [
                          'persisted.GCTTSSelectedVoice',
                          value,
                        ])
                    "
                  />
                </NvFormItem>
              </template>
              <template v-if="selectedEngineTab === 'iwtts'">
                <NvStack spacing="5">
                  <NvFormItem label="API Key">
                    <NvInput
                      :modelValue="decrypt($store.getters['settings/persisted'].IWTTSApiKey)"
                      show-password
                      type="password"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', [
                            'persisted.IWTTSApiKey',
                            encrypt(value),
                          ])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvStack spacing="5">
                  <NvFormItem label="Url">
                    <NvInput
                      :modelValue="$store.getters['settings/persisted'].IWTTSUrl"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', ['persisted.IWTTSUrl', value])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Voice">
                  <IWTTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].IWTTSSelectedVoice"
                    @update:modelValue="
                      (value) =>
                        $store.dispatch('settings/setProperty', [
                          'persisted.IWTTSSelectedVoice',
                          value,
                        ])
                    "
                  />
                </NvFormItem>
              </template>
              <template v-if="selectedEngineTab === 'matts'">
                <NvStack spacing="5">
                  <NvFormItem label="API Key">
                    <NvInput
                      :modelValue="decrypt($store.getters['settings/persisted'].MATTSApiKey)"
                      show-password
                      type="password"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', [
                            'persisted.MATTSApiKey',
                            encrypt(value),
                          ])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvStack spacing="5">
                  <NvFormItem label="Region">
                    <NvInput
                      :modelValue="$store.getters['settings/persisted'].MATTSRegion"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', ['persisted.MATTSRegion', value])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Voice">
                  <MATTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].MATTSSelectedVoice"
                    @update:modelValue="
                      (value) =>
                        $store.dispatch('settings/setProperty', [
                          'persisted.MATTSSelectedVoice',
                          value,
                        ])
                    "
                  />
                </NvFormItem>
              </template>
              <template v-if="selectedEngineTab === 'aptts'">
                <NvStack spacing="5">
                  <NvFormItem label="Identity pool ID">
                    <NvInput
                      :modelValue="
                        decrypt($store.getters['settings/persisted'].APTTSIdentityPoolId)
                      "
                      show-password
                      type="password"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', [
                            'persisted.APTTSIdentityPoolId',
                            encrypt(value),
                          ])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvStack spacing="5">
                  <NvFormItem label="Region">
                    <NvInput
                      :modelValue="$store.getters['settings/persisted'].APTTSRegion"
                      @update:modelValue="
                        (value) =>
                          $store.dispatch('settings/setProperty', ['persisted.APTTSRegion', value])
                      "
                    />
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal" />
                <NvFormItem label="Voice">
                  <APTTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].APTTSSelectedVoice"
                    @update:modelValue="
                      (value) =>
                        $store.dispatch('settings/setProperty', [
                          'persisted.APTTSSelectedVoice',
                          value,
                        ])
                    "
                  />
                </NvFormItem>
              </template>
              <template v-if="selectedEngineTab === 'saytts'">
                <NvFormItem label="Voice">
                  <SayTTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].SayTTSSelectedVoice"
                    @update:modelValue="
                      (value) =>
                        $store.dispatch('settings/setProperty', [
                          'persisted.SayTTSSelectedVoice',
                          value,
                        ])
                    "
                  />
                </NvFormItem>
              </template>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { ref } from 'vue'
import { useStore } from 'vuex'
import {
  NvButton,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvText,
} from '@/core/components'
import SpeechEngineSelect from '@/entities/speech/components/inputs/NvSpeechEngineSelect.vue'
import APTTSVoiceSelect from '@/entities/speech/components/inputs/NvAPTTSVoiceSelect.vue'
import GCTTSVoiceSelect from '@/entities/speech/components/inputs/NvGCTTSVoiceSelect.vue'
import IWTTSVoiceSelect from '@/entities/speech/components/inputs/NvIWTTSVoiceSelect.vue'
import MATTSVoiceSelect from '@/entities/speech/components/inputs/NvMATTSVoiceSelect.vue'
import SayTTSVoiceSelect from '@/entities/speech/components/inputs/NvSayTTSVoiceSelect.vue'
import { useEncryption } from '@/utils/security'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

const store = useStore()
const selectedEngineTab = ref<SpeechEngine['id']>(
  store.getters['settings/persisted'].selectedSpeechEngine,
)
const speechEngines = speechEngineManager.getEngines()
const { encrypt, decrypt } = useEncryption()
</script>
