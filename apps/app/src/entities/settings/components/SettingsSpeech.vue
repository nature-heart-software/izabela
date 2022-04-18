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
              @update:modelValue="(value) => {
                selectedEngineTab = value
                $store.dispatch('settings/setProperty', ['persisted.selectedSpeechEngine', value])
              }
        "/>
          </NvGroup>
        </NvCard>
        <div class="pl-8">
          <NvCard>
            <NvStack spacing="5">
              <NvGroup grow>
                <template v-for="engine in SPEECH_ENGINES" :key="engine.id">
                  <NvButton align="center" type="ghost" @click="selectedEngineTab = engine.id"
                            :selected="selectedEngineTab === engine.id">{{ engine.name }}
                  </NvButton>
                </template>
              </NvGroup>
              <NvDivider direction="horizontal"/>
              <template v-if="selectedEngineTab === 'gctts'">
                <NvStack spacing="5">
                  <NvFormItem label="Engine API Key">
                    <NvInput
                      :modelValue="decrypt($store.getters['settings/persisted'].GCTTSApiKey)"
                      @update:modelValue="(value) => $store.dispatch('settings/setProperty', ['persisted.GCTTSApiKey', encrypt(value)])"
                      type="password" show-password/>
                  </NvFormItem>
                </NvStack>
                <NvDivider direction="horizontal"/>
                <NvFormItem label="Engine API Key">
                  <GCTTSVoiceSelect
                    :modelValue="$store.getters['settings/persisted'].GCTTSSelectedVoice"
                    @update:modelValue="(value) => $store.dispatch('settings/setProperty', ['persisted.GCTTSSelectedVoice', value])"
                  />
                </NvFormItem>
              </template>
              <template v-else>
                <NvText align="center">
                  Coming Soon
                </NvText>
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
  NvStack,
  NvText,
  NvCard,
  NvGroup,
  NvButton,
  NvDivider,
  NvFormItem,
  NvInput,
} from '@/core/components'
import SpeechEngineSelect from '@/entities/speech/components/inputs/SpeechEngineSelect.vue'
import GCTTSVoiceSelect from '@/entities/speech/components/inputs/GCTTSVoiceSelect.vue'
import { SPEECH_ENGINES } from '@/entities/speech'
import { useEncryption } from '@/utils/security'

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
    const selectedEngineTab = ref<typeof SPEECH_ENGINES[number]['id']>(store.getters['settings/persisted'].selectedSpeechEngine)
    return {
      SPEECH_ENGINES,
      selectedEngineTab,
      ...useEncryption(),
    }
  },
})
</script>
