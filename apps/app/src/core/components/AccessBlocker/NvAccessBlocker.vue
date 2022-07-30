<template>
  <StAccessBlocker v-bind="props">
    <slot />
    <Transition class="transition">
      <StAccessBlockerReason v-if="!props.allowed">
        <NkCenter class="w-full h-full">
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
import { defineProps } from 'vue'
import NkCenter from '@/core/components/Center/NvCenter.vue'
import NvAlert from '@/core/components/Alert/NvAlert.vue'
import { StAccessBlocker, StAccessBlockerReason } from './access-blocker.styled'
import { props as propsDefinition } from './access-blocker.shared'

const props = defineProps(propsDefinition)
</script>
