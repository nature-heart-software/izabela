<template>
  <NvAccessBlocker
    :allowed="engine.hasCredentials()"
    reason="Credentials required"
  >
    <NvStack spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect
          :modelValue="getProperty('selectedVoice')"
          @update:modelValue="(value) => setProperty('selectedVoice', value)"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Speaking Rate">
        <NvGroup>
          <NvRangeInput
            :max="300"
            :min="-300"
            :step="1"
            class="!grow"
            v-bind="{
              modelValue: getProperty('ratePercentage'),
              'onUpdate:modelValue': (value) =>
                setProperty('ratePercentage', value),
            }"
          />
          <NvNumberInput
            :max="300"
            :min="-300"
            :step="1"
            v-bind="{
              modelValue: getProperty('ratePercentage'),
              'onUpdate:modelValue': (value) =>
                setProperty('ratePercentage', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Pitch">
        <NvGroup>
          <NvRangeInput
            :max="300"
            :min="-300"
            :step="1"
            class="!grow"
            v-bind="{
              modelValue: getProperty('pitchPercentage'),
              'onUpdate:modelValue': (value) =>
                setProperty('pitchPercentage', value),
            }"
          />
          <NvNumberInput
            :max="300"
            :min="-300"
            :step="1"
            v-bind="{
              modelValue: getProperty('pitchPercentage'),
              'onUpdate:modelValue': (value) =>
                setProperty('pitchPercentage', value),
            }"
          />
        </NvGroup>
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
  <template v-if="!form && speechStore.hasUniversalApiCredentials">
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
      !form &&
      (getProperty('useLocalCredentials') ||
        !speechStore.hasUniversalApiCredentials)
    "
  >
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="API Key">
        <NvInput
          :modelValue="getProperty('apiKey', true)"
          show-password
          type="password"
          @update:modelValue="(value) => setProperty('apiKey', value, true)"
        />
      </NvFormItem>
    </NvStack>
    <NvDivider direction="horizontal" />
    <NvStack spacing="5">
      <NvFormItem label="Url">
        <NvInput
          :modelValue="getProperty('url')"
          @update:modelValue="(value) => setProperty('url', value)"
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
  NvNumberInput,
  NvRangeInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { useSpeechStore } from '@/features/speech/store'
import NvVoiceSelect from './NvVoiceSelect'
import { store } from './store'
import { engine } from './register.ts'

const speechStore = useSpeechStore()
const props = defineProps({
  form: Object,
})
const { getProperty, setProperty, getStoreProperty } = store.useStoreOrForm(
  props.form,
)
</script>
