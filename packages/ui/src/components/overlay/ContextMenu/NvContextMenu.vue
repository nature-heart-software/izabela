<template>
  <StContextMenu v-bind="props">
    <tippy ref="tippyRef" v-bind="tippyProps">
      <slot />
      <template #content>
        <div>
          <template v-for="option in props.options">
            <template v-if="option?.type === 'divider'">
              <NvDivider direction="horizontal" />
            </template>
            <template v-else>
              <NvOption
                :disabled="option.disabled"
                @click=";[option.onClick?.(), close()]"
              >
                <NvGroup>
                  <NvIcon v-if="option.icon" :name="option.icon" :size="3" />
                  {{ option.label }}
                </NvGroup>
              </NvOption>
            </template>
          </template>
        </div>
      </template>
    </tippy>
  </StContextMenu>
</template>
<script lang="ts" setup>
import { defineProps, ref } from 'vue'
import { StContextMenu } from './context-menu.styled'
import { props as propsDefinition } from './context-menu.shared'
import { Tippy } from 'vue-tippy'
import { tokens } from '@/styles/tokens'
import NvOption from '@/components/forms/Select/NvOption.vue'
import NvDivider from '@/components/miscellaneous/Divider/NvDivider.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvIcon from '@/components/typography/Icon/NvIcon.vue'

const props = defineProps(propsDefinition)
const tippyProps: (typeof props)['tippyOptions'] = {
  trigger: 'click',
  interactive: true,
  placement: 'bottom-end',
  offset: [0, tokens.spacing['4']],
  theme: `context-menu`,
  maxWidth: 300,
  ...props.tippyOptions,
}
const tippyRef = ref()
const close = () => {
  tippyRef.value?.hide()
}
</script>
