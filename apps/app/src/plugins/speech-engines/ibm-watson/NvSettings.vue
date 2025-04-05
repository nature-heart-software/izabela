<template>
  <NvAccessBlocker
    :allowed="
      (speechStore.hasUniversalApiCredentials &&
        !getProperty('useLocalCredentials')) ||
      [getProperty('apiKey', true), getProperty('url')].every(Boolean)
    "
    reason="Credentials required"
  >
    <NvStack spacing="5">
      <NvFormItem label="Voice">
        <NvVoiceSelect />
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
import { getProperty, setProperty } from './store'

const speechStore = useSpeechStore()
</script>
