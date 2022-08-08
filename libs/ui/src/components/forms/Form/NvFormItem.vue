<template>
  <NvStack spacing="3">
    <NvText v-if="label" type="label"
    ><label :for="name">{{ label }}</label></NvText
    >
    <NvStack>
      <slot></slot>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import NvText from '@/components/typography/Text/NvText.vue'

defineProps({
  name: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
})
</script>
