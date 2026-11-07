<template>
  <StTag v-bind="props">
    <StTagContentWrapper v-bind="props">
      <slot />
      <StTagIcon>
        <NvButton
          icon-name="times"
          aria-label="Remove tag"
          size="xs"
          type="ghost"
          @click="() => emit('close')"
        />
      </StTagIcon>
    </StTagContentWrapper>
  </StTag>
</template>
<script lang="ts" setup>
import { StTag, StTagContentWrapper, StTagIcon } from './tag.panda'
import { props as propsDefinition } from './tag.shared'
import NvButton from '@/components/forms/Button/NvButton.vue'

const props = defineProps(propsDefinition)
const emit = defineEmits(['close'])
</script>
