<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Speech</NvText>
      <NvStack spacing="4">
        <NvCard>
          <NvGroup spacing="5">
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
              <template v-else>
                <NvText align="center">Coming Soon</NvText>
              </template>
            </NvStack>
          </NvCard>
        </div>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts">
import { defineComponent, ref } from 'vue'
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
import SpeechEngineSelect from '@/entities/speech/components/inputs/SpeechEngineSelect.vue'
import GCTTSVoiceSelect from '@/entities/speech/components/inputs/GCTTSVoiceSelect.vue'
import { useEncryption } from '@/utils/security'
import speechEngineManager from '@/entities/speech/modules/speech-engine-manager'
import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

export default defineComponent({
  name: 'SettingsSpeech',
  components: {
    SpeechEngineSelect,
    GCTTSVoiceSelect,
    NvCard,
    NvStack,
    NvGroup,
    NvText,
    NvButton,
    NvDivider,
    NvFormItem,
    NvInput,
  },
  setup() {
    const store = useStore()
    const selectedEngineTab = ref<SpeechEngine['id']>(
      store.getters['settings/persisted'].selectedSpeechEngine,
    )
    return {
      speechEngines: speechEngineManager.getEngines(),
      selectedEngineTab,
      ...useEncryption(),
    }
  },
})
</script>
