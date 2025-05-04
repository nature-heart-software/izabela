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
        <NvFormItem label="Translation engine">
          <NvTranslationEngineSelect
            v-bind="{
              ...(form
                ? {
                    modelValue: form['settings.selectedTranslationEngine'],
                    'onUpdate:modelValue': (value) =>
                      (form['settings.selectedTranslationEngine'] = value),
                  }
                : {
                    modelValue: settingsStore.selectedTranslationEngine,
                    'onUpdate:modelValue': (value) =>
                      settingsStore.$patch({
                        selectedTranslationEngine: value,
                      }),
                  }),
            }"
          />
        </NvFormItem>
        <NvDivider direction="horizontal" />
        <template v-if="currentEngineSettingsComponent">
          <component
            :is="currentEngineSettingsComponent"
            :form="form"
            :size="size"
          />
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
import { useSettingsStore } from '@/features/settings/store'
import { computed, PropType } from 'vue'
import NvTranslationEngineSelect from '@/features/translation/components/inputs/NvTranslationEngineSelect.vue'
import translationEngineManager from '@/modules/translation-engine-manager'

const settingsStore = useSettingsStore()
const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
  form: Object,
})

const engine = computed(() => {
  if (props.form)
    return translationEngineManager.getEngineById(
      props.form['settings.selectedTranslationEngine'],
    )
  return translationEngineManager.getEngineById(
    settingsStore.selectedTranslationEngine,
  )
})

const currentEngineSettingsComponent = computed(
  () => engine.value?.settingsComponent,
)
</script>
