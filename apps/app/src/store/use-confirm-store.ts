import { defineStore } from 'pinia'
import { ref } from 'vue'
import { NvDialog, NvButton } from '@packages/ui'
import { Deferred } from '@packages/toolbox'
import { v4 as uuid } from 'uuid'

export type StoreDialog = {
  id: string
  title?: string
  description?: string
  remove: () => void
  deferred: ReturnType<typeof Deferred>
  dialogProps?: Partial<InstanceType<typeof NvDialog>['$props']>
  actions: {
    type: string
    label: string
    buttonProps?: Partial<InstanceType<typeof NvButton>['$props']>
  }[]
}

export const useConfirmStore = defineStore('confirm', () => {
  const instances = ref<StoreDialog[]>([])
  return {
    instances,
    confirm(
      options: Pick<
        StoreDialog,
        'dialogProps' | 'actions' | 'title' | 'description'
      >,
    ) {
      const deferredPromise = Deferred<{
        type: string
        instance: StoreDialog
        close: () => void
      }>()
      const id = uuid()
      function remove() {
        const index = instances.value.findIndex(
          (instance) => instance.id === id,
        )
        if (index > -1) {
          instances.value.splice(index, 1)
        }
      }
      instances.value.push({
        id,
        deferred: deferredPromise as any,
        remove,
        ...options,
      })

      return deferredPromise.promise
    },
  }
})
