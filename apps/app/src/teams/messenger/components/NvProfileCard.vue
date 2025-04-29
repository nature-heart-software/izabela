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
                :modelValue="form.states['settings.selectedSpeechEngine']"
                class="w-1/3"
                size="sm"
                @update:modelValue="onEnginesChange"
              />
              <template v-if="engine">
                <component
                  :is="engine.voiceSelectComponent"
                  v-if="engine.voiceSelectComponent"
                  v-model="
                    form.states[
                      `${engine.store.getId()}.pluginState.selectedVoice`
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
  NvDivider,
  NvGroup,
  NvInput,
  NvStack,
  NvSwitch,
  NvText,
} from '@packages/ui'
import { computed, reactive, watch } from 'vue'
import { useProfilesStore } from '@/features/profiles/store.ts'
import { Profile } from '@/features/profiles/types.ts'
import NvKeybinding from '@/features/app/components/inputs/NvKeybinding.vue'
import { getEngineById, getEngines } from '@/modules/speech-engine-manager'
import { useSettingsStore } from '@/features/settings/store'
import NvSpeechEngineSelect from '@/features/speech/components/inputs/NvSpeechEngineSelect.vue'
import { useSpeechStore } from '@/features/speech/store'
import { cloneDeep } from 'lodash'

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

const engine = computed(() => {
  if (!form.states['settings.selectedSpeechEngine']) return null
  return getEngineById(form.states['settings.selectedSpeechEngine'])
})

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

function onEnginesChange(value) {
  form.states['settings.selectedSpeechEngine'] = value
  getEngines().map((e) => {
    Object.keys(form.states).forEach((key) => {
      if (key.startsWith(e.store.getId())) {
        delete form.states[key]
      }
    })
  })
  const engine = getEngineById(value)
  if (engine) {
    const key = `${engine.store.getId()}.pluginState.selectedVoice`
    form.states[key] = cloneDeep(engine.getSelectedVoice())
  }
}
</script>
