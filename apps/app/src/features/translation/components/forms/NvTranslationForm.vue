<template>
  <NvStack :spacing="size === 'sm' ? 4 : 5">
    <NvGroup justify="apart" no-wrap>
      <NvStack>
        <NvText type="label">Enable translation</NvText>
      </NvStack>
      <NvSwitch
        class="shrink-0"
        v-bind="{
          ...(form
            ? {
                modelValue: form['settings.enableTranslation'],
                'onUpdate:modelValue': (value) =>
                  (form['settings.enableTranslation'] = value),
              }
            : {
                modelValue: settingsStore.enableTranslation,
                'onUpdate:modelValue': (value) =>
                  settingsStore.$patch({ enableTranslation: value }),
              }),
        }"
      />
    </NvGroup>
    <NvDivider direction="horizontal" />
    <NvAccessBlocker
      :allowed="
        form
          ? form['settings.enableTranslation']
          : settingsStore.enableTranslation
      "
      reason="Translation needs to be enabled"
    >
      <NvStack :spacing="size === 'sm' ? 4 : 5">
        <NvFormItem label="Translation strategy">
          <NvTranslationStrategySelect
            v-bind="{
              ...(form
                ? {
                    modelValue: form['settings.textTranslationStrategy'],
                    'onUpdate:modelValue': (value) =>
                      (form['settings.textTranslationStrategy'] = value),
                  }
                : undefined),
            }"
          />
        </NvFormItem>
        <template
          v-if="
            (form
              ? form['settings.textTranslationStrategy']
              : settingsStore.textTranslationStrategy) === 'cloud-translation'
          "
        >
          <NvDivider direction="horizontal" />
          <NvAccessBlocker
            :allowed="!!googleCloudSpeechCredentialsPath"
            reason="Google Cloud credentials required"
          >
            <NvStack :spacing="size === 'sm' ? 4 : 5">
              <NvFormItem label="From">
                <NvTranslationFromSelect
                  v-bind="{
                    ...(form
                      ? {
                          modelValue: form['settings.textInputLanguage'],
                          'onUpdate:modelValue': (value) =>
                            (form['settings.textInputLanguage'] = value),
                        }
                      : undefined),
                  }"
                />
              </NvFormItem>
              <NvDivider direction="horizontal" />
              <NvFormItem label="To">
                <NvTranslationToSelect
                  v-bind="{
                    ...(form
                      ? {
                          modelValue: form['settings.textOutputLanguage'],
                          'onUpdate:modelValue': (value) =>
                            (form['settings.textOutputLanguage'] = value),
                        }
                      : undefined),
                  }"
                />
              </NvFormItem>
            </NvStack>
          </NvAccessBlocker>
        </template>
        <template
          v-if="
            (form
              ? form['settings.textTranslationStrategy']
              : settingsStore.textTranslationStrategy) === 'custom'
          "
        >
          <NvDivider direction="horizontal" />
          <NvAccessBlocker
            :allowed="!!settingsStore.customTextTranslationEndpoint"
            reason="Endpoint and/or credentials required"
          >
            <NvStack :spacing="size === 'sm' ? 4 : 5">
              <NvFormItem label="From">
                <NvCustomTranslationFromSelect
                  v-bind="{
                    ...(form
                      ? {
                          modelValue:
                            form['settings.customTextTranslationFrom'],
                          'onUpdate:modelValue': (value) =>
                            (form['settings.customTextTranslationFrom'] =
                              value),
                        }
                      : undefined),
                  }"
                />
              </NvFormItem>
              <NvDivider direction="horizontal" />
              <NvFormItem label="To">
                <NvCustomTranslationToSelect
                  v-bind="{
                    ...(form
                      ? {
                          modelValue: form['settings.customTextTranslationTo'],
                          'onUpdate:modelValue': (value) =>
                            (form['settings.customTextTranslationTo'] = value),
                        }
                      : undefined),
                  }"
                />
              </NvFormItem>
            </NvStack>
          </NvAccessBlocker>
        </template>
      </NvStack>
    </NvAccessBlocker>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvAccessBlocker,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import NvTranslationStrategySelect from '@/features/translation/components/inputs/NvTranslationStrategySelect.vue'
import NvCustomTranslationFromSelect from '@/features/translation/components/inputs/NvCustomTranslationFromSelect.vue'
import NvCustomTranslationToSelect from '@/features/translation/components/inputs/NvCustomTranslationToSelect.vue'
import NvTranslationToSelect from '@/features/translation/components/inputs/NvTranslationToSelect.vue'
import NvTranslationFromSelect from '@/features/translation/components/inputs/NvTranslationFromSelect.vue'
import { useSettingsStore } from '@/features/settings/store'
import { PropType } from 'vue'
import { useGetGoogleCloudSpeechCredentialsPath } from '@/features/settings/hooks'

const settingsStore = useSettingsStore()
const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})
const { data: googleCloudSpeechCredentialsPath } =
  useGetGoogleCloudSpeechCredentialsPath()
</script>
