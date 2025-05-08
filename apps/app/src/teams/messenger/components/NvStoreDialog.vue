<template>
  <NvDialog
    v-model:open="open"
    :portal-target="props.portalTarget"
    v-bind="props.instance.dialogProps"
    @close="props.instance.close"
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
import { ref, PropType, onMounted } from 'vue'
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
</script>
