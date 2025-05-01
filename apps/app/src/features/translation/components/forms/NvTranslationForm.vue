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
                modelValue: form.enableTranslation,
                'onUpdate:modelValue': (value) =>
                  (form.enableTranslation = value),
              }
            : {
                modelValue: settingsStore.enableTranslation,
                'onUpdate:modelValue': (value) =>
                  settingsStore.$patch({ enableTranslation: value }),
              }),
        }"
      />
    </NvGroup>
    <NvAccessBlocker
      :allowed="
        [settingsStore.enableTranslation, form?.enableTranslation].some(Boolean)
      "
      reason="Translation needs to be enabled"
    >
      <NvStack :spacing="size === 'sm' ? 4 : 5">
        <NvDivider direction="horizontal" />
        <NvFormItem label="Translation strategy">
          <NvTranslationStrategySelect
            v-bind="{
              ...(form
                ? {
                    modelValue: form.textTranslationStrategy,
                    'onUpdate:modelValue': (value) =>
                      (form.textTranslationStrategy = value),
                  }
                : undefined),
            }"
          />
        </NvFormItem>
        <NvDivider direction="horizontal" />
        <template
          v-if="
            (form
              ? form?.textTranslationStrategy
              : settingsStore.textTranslationStrategy) === 'cloud-translation'
          "
        >
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
                          modelValue: form.textInputLanguage,
                          'onUpdate:modelValue': (value) =>
                            (form.textInputLanguage = value),
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
                          modelValue: form.textOutputLanguage,
                          'onUpdate:modelValue': (value) =>
                            (form.textOutputLanguage = value),
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
              ? form?.textTranslationStrategy
              : settingsStore.textTranslationStrategy) === 'custom'
          "
        >
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
                          modelValue: form.customTextTranslationFrom,
                          'onUpdate:modelValue': (value) =>
                            (form.customTextTranslationFrom = value),
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
                          modelValue: form.customTextTranslationTo,
                          'onUpdate:modelValue': (value) =>
                            (form.customTextTranslationTo = value),
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
