<template>
  <NvStack :spacing="3" :class="formItem()">
    <NvText v-if="label" type="label"
      ><label :for="name">{{ label }}</label></NvText
    >
    <NvStack>
      <slot></slot>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { formItem } from './form-item.panda'
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
