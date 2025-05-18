<template>
  <NvAccessBlocker
    :allowed="!!getStoreProperty('endpoint')"
    reason="Endpoint and/or credentials required"
  >
    <NvStack :spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect
          :modelValue="getProperty('selectedVoice')"
          placeholder="Select a voice"
          @update:modelValue="(value) => setProperty('selectedVoice', value)"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Additional data">
        <NvTextarea
          placeholder="Additional data you want to send to the server..."
          :modelValue="getProperty('additionalData')"
          @update:modelValue="(value) => setProperty('additionalData', value)"
        />
      </NvFormItem>
      <template v-if="!form">
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
        <NvDivider direction="horizontal" />
        <NvGroup :spacing="5" justify="apart" no-wrap>
          <NvStack>
            <NvText type="label">Provide timestamps to WebSocket events</NvText>
          </NvStack>
          <NvSwitch
            :modelValue="getProperty('includeTimestamps')"
            class="shrink-0"
            @update:modelValue="
              (value) => setProperty('includeTimestamps', value)
            "
          />
        </NvGroup>
      </template>
    </NvStack>
  </NvAccessBlocker>
  <template v-if="!form">
    <NvDivider direction="horizontal" />
    <NvFormItem label="API Endpoint">
      <NvInput
        :modelValue="getProperty('endpoint')"
        @update:modelValue="(value) => setProperty('endpoint', value)"
      />
    </NvFormItem>
    <NvDivider direction="horizontal" />
    <NvFormItem label="API Key">
      <NvInput
        :modelValue="getProperty('apiKey', true)"
        show-password
        type="password"
        @update:modelValue="(value) => setProperty('apiKey', value, true)"
      />
    </NvFormItem>
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
  NvTextarea,
} from '@packages/ui'
import NvVoiceSelect from './NvVoiceSelect'
import { store } from './store'

const props = defineProps({
  form: Object,
})
const { getProperty, setProperty, getStoreProperty } = store.useStoreOrForm(
  props.form,
)
</script>
