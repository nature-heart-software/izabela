<template>
  <NvAccessBlocker
    :allowed="
      (speechStore.hasUniversalApiCredentials &&
        !getProperty('useLocalCredentials')) ||
      [getProperty('publicKey', true), getProperty('privateKey', true)].every(
        Boolean,
      )
    "
    reason="Credentials required"
  >
    <NvStack :spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect
          :modelValue="getProperty('selectedVoice')"
          @update:modelValue="(value) => setProperty('selectedVoice', value)"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" align="start" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Stream audio</NvText>
          <NvText
            >Allows for faster audio playback, may cause audio artifacts
          </NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('streamAudio')"
          class="shrink-0"
          @update:modelValue="(value) => setProperty('streamAudio', value)"
        />
      </NvGroup>
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Prefer cache on every message</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('useCacheOnEveryRequest')"
          @update:modelValue="
            (value) => setProperty('useCacheOnEveryRequest', value)
          "
        />
      </NvGroup>
    </NvStack>
  </NvAccessBlocker>
  <template v-if="speechStore.hasUniversalApiCredentials">
    <NvDivider direction="horizontal" />
    <NvGroup justify="apart" no-wrap spacing="5">
      <NvStack>
        <NvText type="label">Use my own credentials</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="getProperty('useLocalCredentials')"
        @update:modelValue="
          (value) => setProperty('useLocalCredentials', value)
        "
      />
    </NvGroup>
  </template>
  <template
    v-if="
      getProperty('useLocalCredentials') ||
      !speechStore.hasUniversalApiCredentials
    "
  >
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Public API Key">
        <NvInput
          :modelValue="getProperty('publicKey', true)"
          show-password
          type="password"
          @update:modelValue="(value) => setProperty('publicKey', value, true)"
        />
      </NvFormItem>
    </NvStack>
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Private API Key">
        <NvInput
          :modelValue="getProperty('privateKey', true)"
          show-password
          type="password"
          @update:modelValue="(value) => setProperty('privateKey', value, true)"
        />
      </NvFormItem>
    </NvStack>
  </template>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { store } from './store'

const speechStore = useSpeechStore()
const props = defineProps({
  form: Object,
})
const { getProperty, setProperty } = store.useStoreOrForm(props.form)
</script>
