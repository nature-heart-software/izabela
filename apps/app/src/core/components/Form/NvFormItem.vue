<template>
  <NvStack spacing="3">
    <NvText type="label" v-if="label"><label :for="name">{{ label }}</label></NvText>
    <NvStack>
      <slot></slot>
    </NvStack>
  </NvStack>
</template>
<script lang="ts">
import { defineComponent } from 'vue'
import NvStack from '@/core/components/Stack/NvStack.vue'
import NvText from '@/core/components/Text/NvText.vue'

export default defineComponent({
  name: 'NvFormItem',
  components: { NvStack, NvText },
  props: {
    name: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
  },
})
</script>
