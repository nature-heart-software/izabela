<template>
  <NvCard>
    <NvStack>
      <NvGroup align="start" justify="between" noWrap>
        <NvGroup align="start" class="!flex-1 min-w-0" noWrap>
          <!--          <NvButton-->
          <!--            :loading="isLoading"-->
          <!--            class="shrink-0"-->
          <!--            icon-name="play"-->
          <!--            size="sm"-->
          <!--            @click="() => play()"-->
          <!--          />-->
          <NvStack class="!flex-1 min-h-0">
            <NvInput
              v-model="form.name"
              class="w-full"
              placeholder="Profile name"
              size="sm"
            />
            <NvGroup noWrap>
              <NvSpeechEngineSelect
                v-model="form.states['settings.selectedSpeechEngine']"
                class="w-1/3"
                size="sm"
              />
              <template v-if="speechEngine">
                <component
                  :is="speechEngine.voiceSelectComponent"
                  v-if="speechEngine.voiceSelectComponent"
                  v-model="
                    form.states[
                      speechEngine.store.getPropertyPath('selectedVoice')
                    ]
                  "
                  class="w-1/3"
                  placeholder="Speech Voice"
                  size="sm"
                />
              </template>
              <NvKeybinding
                v-model="form.shortcut"
                class="w-1/3"
                multiple
                size="sm"
              />
            </NvGroup>
          </NvStack>
        </NvGroup>
        <NvStack>
          <NvContextMenu
            :options="[
              {
                label: 'Delete',
                icon: 'trash-alt',
                onClick: () => {
                  profilesStore.delete(id)
                },
              },
            ]"
          >
            <NvButton class="shrink-0" icon-name="ellipsis-v" size="sm" />
          </NvContextMenu>
          <NvDialog portalTarget="#settings">
            <template #reference>
              <NvTooltip>
                <NvText>More settings</NvText>
                <template #reference>
                  <NvButton icon-name="setting" size="sm" />
                </template>
              </NvTooltip>
            </template>
            <template #title>"{{ form.name }}" profile settings</template>
            <template #description>
              <NvStack spacing="5">
                <NvFormItem label="Speech engine">
                  <NvSpeechEngineSelect
                    v-model="form.states['settings.selectedSpeechEngine']"
                  />
                </NvFormItem>
                <NvDivider direction="horizontal" />
                <template v-if="currentEngineSettingsComponent">
                  <component
                    :is="currentEngineSettingsComponent"
                    :form="form.states"
                  />
                </template>
                <NvDivider direction="horizontal" />
                <NvTranslationForm :form="form.states" />
              </NvStack>
            </template>
          </NvDialog>
        </NvStack>
      </NvGroup>
      <NvDivider direction="horizontal" />
      <NvGroup :spacing="5" justify="apart" no-wrap>
        <NvStack>
          <NvText type="label">Open Messenger window on trigger</NvText>
        </NvStack>
        <NvSwitch
          :modelValue="form.openMessengerOnTrigger"
          @update:modelValue="(value) => (form.openMessengerOnTrigger = value)"
        />
      </NvGroup>
    </NvStack>
  </NvCard>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvContextMenu,
  NvDialog,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
  NvTooltip,
} from '@packages/ui'
import { computed, reactive, watch } from 'vue'
import { useProfilesStore } from '@/features/profiles/store.ts'
import { Profile } from '@/features/profiles/types.ts'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import speechEngineManager from '@/modules/speech-engine-manager'
import translationEngineManager from '@/modules/translation-engine-manager'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSpeechStore } from '@/features/speech/store'
import cloneDeep from 'lodash/cloneDeep'
import NvTranslationForm from '@/features/translation/components/forms/NvTranslationForm.vue'

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
})
const profilesStore = useProfilesStore()
const settingsStore = useSettingsStore()
const speechStore = useSpeechStore()
const profile = profilesStore.profiles.find(
  (profile) => profile.id === props.id,
)

const form = reactive(cloneDeep(profile) as Profile)

const speechEngine = computed(() => {
  if (!form.states['settings.selectedSpeechEngine']) return null
  return speechEngineManager.getEngineById(
    form.states['settings.selectedSpeechEngine'],
  )
})

watch([form], console.log, { deep: true })

watch(
  form,
  () => {
    profilesStore.$patch({
      profiles: profilesStore.profiles.map((p) =>
        p.id === form.id ? form : p,
      ),
    })
  },
  { deep: true },
)

watch(
  () => form.states['settings.selectedSpeechEngine'],
  (value) => {
    speechEngineManager.getEngines().map((e) => {
      Object.keys(form.states).forEach((key) => {
        if (key.startsWith(e.store.getId())) {
          delete form.states[key]
        }
      })
    })
    const defaultValues = profilesStore.getSpeechEngineDefaultValues(value)
    Object.assign(form.states, cloneDeep(defaultValues))
  },
)

watch(
  () => form.states['settings.selectedTranslationEngine'],
  (value) => {
    translationEngineManager.getEngines().map((e) => {
      Object.keys(form.states).forEach((key) => {
        if (key.startsWith(e.store.getId())) {
          delete form.states[key]
        }
      })
    })
    const defaultValues = profilesStore.getTranslationEngineDefaultValues(value)
    Object.assign(form.states, cloneDeep(defaultValues))
  },
)

const currentEngineSettingsComponent = computed(
  () => speechEngine.value?.settingsComponent,
)
</script>
