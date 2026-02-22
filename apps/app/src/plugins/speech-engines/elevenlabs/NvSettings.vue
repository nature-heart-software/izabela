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
      <NvFormItem label="Model">
        <NvModelSelect
          :modelValue="getProperty('model_id')"
          placeholder="Select a model"
          @update:modelValue="(value) => setProperty('model_id', value)"
        />
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Stability">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('stability'),
              'onUpdate:modelValue': (value) => setProperty('stability', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('stability'),
              'onUpdate:modelValue': (value) => setProperty('stability', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Similarity">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('similarity_boost'),
              'onUpdate:modelValue': (value) =>
                setProperty('similarity_boost', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('similarity_boost'),
              'onUpdate:modelValue': (value) =>
                setProperty('similarity_boost', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Style Exaggeration">
        <NvGroup>
          <NvRangeInput
            :max="1"
            :min="0"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('style'),
              'onUpdate:modelValue': (value) => setProperty('style', value),
            }"
          />
          <NvNumberInput
            :max="1"
            :min="0"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('style'),
              'onUpdate:modelValue': (value) => setProperty('style', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvFormItem label="Speed">
        <NvGroup>
          <NvRangeInput
            :max="1.2"
            :min="0.7"
            :step="0.01"
            class="!grow"
            v-bind="{
              modelValue: getProperty('speed'),
              'onUpdate:modelValue': (value) => setProperty('speed', value),
            }"
          />
          <NvNumberInput
            :max="1.2"
            :min="0.7"
            :step="0.01"
            v-bind="{
              modelValue: getProperty('speed'),
              'onUpdate:modelValue': (value) => setProperty('speed', value),
            }"
          />
        </NvGroup>
      </NvFormItem>
      <NvDivider direction="horizontal" />
      <NvGroup justify="apart" no-wrap spacing="5">
        <NvStack>
          <NvText type="label">Speaker Boost</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="getProperty('use_speaker_boost')"
          @update:modelValue="
            (value) => setProperty('use_speaker_boost', value)
          "
        />
      </NvGroup>
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
import NvVoiceSelect from './NvVoiceSelect'
import { store } from './store'
import NvModelSelect from './NvModelSelect.vue'
import { engine } from './register.ts'

const props = defineProps({
  form: Object,
})
const { getProperty, setProperty, getStoreProperty } = store.useStoreOrForm(
  props.form,
)
</script>
