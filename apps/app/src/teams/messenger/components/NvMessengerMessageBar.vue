<template>
  <NvCard size="sm">
    <NvGroup noWrap>
      <NvPopover placement="top-end" size="sm">
        <div class="w-screen max-w-full">
          <NvStack spacing="4">
            <NvFormItem label="Message mode">
              <NvMessageModeSelect class="w-full" />
            </NvFormItem>
          </NvStack>
        </div>
        <template #reference>
          <NvTooltip>
            <NvText>Message mode</NvText>
            <template #reference>
              <NvButton
                data-v-step="message-mode-buttons"
                icon-name="direction"
                size="sm"
                >Mode
              </NvButton>
            </template>
          </NvTooltip>
        </template>
      </NvPopover>
      <!--      <NvTooltip>-->
      <!--        <NvText>Message mode</NvText>-->
      <!--        <template #reference>-->
      <!--          <NvGroup data-v-step="message-mode-buttons" noWrap>-->
      <!--            <NvButton-->
      <!--              :type="settingsStore.messageMode === 'sentence' && 'plain'"-->
      <!--              size="sm"-->
      <!--              @click="settingsStore.$patch({ messageMode: 'sentence' })"-->
      <!--              >Sentence-->
      <!--            </NvButton>-->
      <!--            <NvButton-->
      <!--              :type="settingsStore.messageMode === 'word' && 'plain'"-->
      <!--              size="sm"-->
      <!--              @click="settingsStore.$patch({ messageMode: 'word' })"-->
      <!--              >Word-->
      <!--            </NvButton>-->
      <!--          </NvGroup>-->
      <!--        </template>-->
      <!--      </NvTooltip>-->
      <NvDivider class="h-3" direction="vertical" />
      <NvPopover placement="top-end" size="sm">
        <div class="w-screen max-w-full">
          <NvTranslationForm size="sm" />
        </div>
        <template #reference>
          <NvTooltip>
            <NvText
              >Translation
              <template v-if="settingsStore.enableTranslation">
                - Running
              </template>
            </NvText>
            <template #reference>
              <NvButton
                :type="settingsStore.enableTranslation ? 'active' : 'default'"
                data-v-step="translation-button"
                icon-name="english-to-chinese"
                size="sm"
                @click.right.prevent.stop="
                  settingsStore.$patch({
                    enableTranslation: !settingsStore.enableTranslation,
                  })
                "
                @click.ctrl.prevent.stop="
                  settingsStore.$patch({
                    enableTranslation: !settingsStore.enableTranslation,
                  })
                "
              />
            </template>
          </NvTooltip>
        </template>
      </NvPopover>
      <NvTooltip>
        <NvText>Dictionary</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name === 'settings-dictionary' &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="dictionary-button"
            icon-name="books"
            size="sm"
            @click="
              messengerContext.navigateTo({ name: 'settings-dictionary' })
            "
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Message shortcuts</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name === 'messages-shortcuts' &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="message-shortcuts-button"
            icon-name="keyboard-alt"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'messages-shortcuts' })"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Message history</NvText>
        <template #reference>
          <NvButton
            :type="
              route.name === 'messages-history' &&
              messengerContext.isViewShown.value
                ? 'plain'
                : 'default'
            "
            data-v-step="message-history-button"
            icon-name="history"
            size="sm"
            @click="messengerContext.navigateTo({ name: 'messages-history' })"
          />
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvDivider,
  NvFormItem,
  NvGroup,
  NvPopover,
  NvStack,
  NvText,
  NvTooltip,
} from '@packages/ui'
import { useSettingsStore } from '@/features/settings/store'
import { inject } from 'vue'
import { useRoute } from 'vue-router'
import NvMessageModeSelect from '@/features/messages/components/inputs/NvMessageModeSelect.vue'
import NvTranslationForm from '@/features/translation/components/forms/NvTranslationForm.vue'

const settingsStore = useSettingsStore()
const messengerContext = inject('messenger')
const route = useRoute()
</script>
