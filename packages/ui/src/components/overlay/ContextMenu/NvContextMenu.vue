<template>
  <StContextMenu v-bind="props">
    <Menu.Root
      v-model:open="open"
      :ids="{ trigger: triggerId }"
      :positioning="positioning"
      loop-focus
      lazy-mount
      unmount-on-exit
      @select="selectOption"
      @interact-outside="onInteractOutside"
    >
      <Menu.Trigger ref="trigger" :id="triggerId" as-child>
        <slot />
      </Menu.Trigger>
      <Teleport :to="portalTarget" defer>
        <div
          v-if="open"
          data-overlay-shield="context-menu"
          :class="contextMenuShield()"
          @click.stop.prevent="open = false"
          @mouseup.stop.prevent
          @mousedown.stop.prevent
          @pointerdown.stop.prevent
          @pointerup.stop.prevent
        />
        <Menu.Context v-slot="menu">
          <Menu.Positioner v-if="open" :class="contextMenuPositioner()">
            <StContextMenuContent>
              <template v-for="(option, index) in props.options" :key="index">
                <Menu.Separator v-if="option.type === 'divider'" as-child>
                  <NvDivider direction="horizontal" />
                </Menu.Separator>
                <Menu.Item
                  v-else
                  :value="String(index)"
                  :disabled="option.disabled"
                  @click.capture="
                    !option.disabled && menu.setHighlightedValue(String(index))
                  "
                  as-child
                >
                  <NvOption :disabled="option.disabled">
                    <NvGroup>
                      <NvIcon
                        v-if="option.icon"
                        :name="option.icon"
                        :size="3"
                      />
                      {{ option.label }}
                    </NvGroup>
                  </NvOption>
                </Menu.Item>
              </template>
            </StContextMenuContent>
          </Menu.Positioner>
        </Menu.Context>
      </Teleport>
    </Menu.Root>
  </StContextMenu>
</template>
<script lang="ts" setup>
import { computed, inject, ref, useId, watchPostEffect } from 'vue'
import { Menu, type MenuRootProps } from '@ark-ui/vue'
import {
  StContextMenu,
  StContextMenuContent,
  contextMenuPositioner,
  contextMenuShield,
} from './context-menu.panda'
import { props as propsDefinition } from './context-menu.shared'
import { tokens } from '@/styles/tokens'
import NvOption from '@/components/forms/Select/NvOption.vue'
import NvDivider from '@/components/miscellaneous/Divider/NvDivider.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'
import { getElement } from '@/utils/vue'
import { PORTAL_TARGET } from '@/consts'

const props = defineProps(propsDefinition)
const open = ref(false)
const trigger = ref()
const triggerId = ref(`nv-menu-${useId()}-trigger`)
watchPostEffect(() => {
  // As-child preserves consumer IDs; Zag must query that same native owner.
  const element = getElement(trigger.value)
  if (element?.id) triggerId.value = element.id
})
const injectedPortalTarget = inject(PORTAL_TARGET)
const portalTarget = computed(
  () => getElement(injectedPortalTarget) || document.body,
)
const positioning = computed<MenuRootProps['positioning']>(() => ({
  placement:
    !props.tippyOptions.placement ||
    props.tippyOptions.placement === 'auto' ||
    props.tippyOptions.placement === 'auto-start' ||
    props.tippyOptions.placement === 'auto-end'
      ? 'bottom-end'
      : props.tippyOptions.placement,
  offset: {
    mainAxis: Array.isArray(props.tippyOptions.offset)
      ? props.tippyOptions.offset[1]
      : tokens.spacing['4'],
    crossAxis: Array.isArray(props.tippyOptions.offset)
      ? props.tippyOptions.offset[0]
      : 0,
  },
}))
function selectOption({ value }: { value: string }) {
  const option = props.options[Number(value)]
  if (option && option.type !== 'divider' && !option.disabled)
    option.onClick?.()
}
function onInteractOutside(event: CustomEvent) {
  // Keep the shield until click finishes instead of exposing controls on pointerup.
  const target = event.detail?.originalEvent?.target as HTMLElement | undefined
  if (target?.closest('[data-overlay-shield="context-menu"]'))
    event.preventDefault()
}
</script>
