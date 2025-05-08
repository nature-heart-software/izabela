<template>
  <NvDialog
    v-bind="{
      ...props.instance.dialogProps,
      portalTarget: props.portalTarget,
      open: open,
      'onUpdate:open': (value) => (open = value),
    }"
  >
    <template #title>
      {{ props.instance.title }}
    </template>
    <template #description>
      {{ props.instance.description }}
    </template>
    <template #footer>
      <NvGroup justify="right">
        <template v-for="action in props.instance.actions">
          <NvButton
            v-bind="action.buttonProps"
            @click="
              props.instance.deferred.resolve({
                type: action.type,
                dialog: props.instance,
                close: () => (open = false),
              })
            "
          >
            {{ action.label }}
          </NvButton>
        </template>
      </NvGroup>
    </template>
  </NvDialog>
</template>
<script lang="ts" setup>
import { ref, PropType, onMounted, watch } from 'vue'
import { NvButton, NvDialog, NvGroup } from '@packages/ui'
import { StoreDialog } from '@/store/use-confirm-store'

const props = defineProps({
  instance: {
    type: Object as PropType<StoreDialog>,
    required: true,
  },
  portalTarget: {
    type: String,
  },
})

const open = ref(false)
onMounted(() => {
  open.value = true
})
watch(
  open,
  (value) => {
    if (!value) {
      setTimeout(props.instance.remove, 1000)
    }
  },
  {
    immediate: false,
  },
)
</script>
