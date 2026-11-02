<template>
  <StAccessBlocker v-bind="props">
    <slot />
    <Transition class="transition">
      <StAccessBlockerReason v-if="!props.allowed">
        <NkCenter :class="accessBlockerCenter()">
          <slot name="reason">
            <NvAlert size="sm">
              {{ props.reason }}
            </NvAlert>
          </slot>
        </NkCenter>
      </StAccessBlockerReason>
    </Transition>
  </StAccessBlocker>
</template>
<script lang="ts" setup>
import NkCenter from '@/components/miscellaneous/Center/NvCenter.vue'
import NvAlert from '@/components/feedback/Alert/NvAlert.vue'
import {
  StAccessBlocker,
  StAccessBlockerReason,
  accessBlockerCenter,
} from './access-blocker.panda'
import { props as propsDefinition } from './access-blocker.shared'

const props = defineProps(propsDefinition)
</script>
