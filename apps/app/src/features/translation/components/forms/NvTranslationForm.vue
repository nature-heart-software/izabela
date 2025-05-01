<template>
  <NvStack :spacing="size === 'sm' ? 4 : 5">
    <NvGroup justify="apart" no-wrap>
      <NvStack>
        <NvText type="label">Enable translation</NvText>
      </NvStack>
      <NvSwitch
        :modelValue="settingsStore.enableTranslation"
        class="shrink-0"
        @update:modelValue="
          (value) => settingsStore.$patch({ enableTranslation: value })
        "
      />
    </NvGroup>
    <NvAccessBlocker
      :allowed="settingsStore.enableTranslation"
      reason="Translation needs to be enabled"
    >
      <NvStack :spacing="size === 'sm' ? 4 : 5">
        <NvDivider direction="horizontal" />
        <NvFormItem label="Translation strategy">
          <NvTranslationStrategySelect />
        </NvFormItem>
        <NvDivider direction="horizontal" />
        <template
          v-if="settingsStore.textTranslationStrategy === 'cloud-translation'"
        >
          <NvAccessBlocker
            :allowed="!!googleCloudSpeechCredentialsPath"
            reason="Google Cloud credentials required"
          >
            <NvStack :spacing="size === 'sm' ? 4 : 5">
              <NvFormItem label="From">
                <NvTranslationFromSelect />
              </NvFormItem>
              <NvDivider direction="horizontal" />
              <NvFormItem label="To">
                <NvTranslationToSelect />
              </NvFormItem>
            </NvStack>
          </NvAccessBlocker>
        </template>
        <template v-if="settingsStore.textTranslationStrategy === 'custom'">
          <NvAccessBlocker
            :allowed="!!settingsStore.customTextTranslationEndpoint"
            reason="Endpoint and/or credentials required"
          >
            <NvStack :spacing="size === 'sm' ? 4 : 5">
              <NvFormItem label="From">
                <NvCustomTranslationFromSelect />
              </NvFormItem>
              <NvDivider direction="horizontal" />
              <NvFormItem label="To">
                <NvCustomTranslationToSelect />
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

const settingsStore = useSettingsStore()
const props = defineProps({
  size: {
    type: String as PropType<'sm' | 'md'>,
    default: 'md',
  },
})
</script>
