<template>
  <StTag v-bind="props">
    <StTagContentWrapper v-bind="props">
      <slot />
      <StTagIcon>
        <NvButton
          icon-name="times"
          size="xs"
          type="ghost"
          @click="() => emit('close')"
        />
      </StTagIcon>
    </StTagContentWrapper>
  </StTag>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { StTag, StTagContentWrapper, StTagIcon } from './tag.styled'
import { props as propsDefinition } from './tag.shared'
import NvButton from '@/components/forms/Button/NvButton.vue'

const props = defineProps(propsDefinition)
const emit = defineEmits(['close'])
</script>
