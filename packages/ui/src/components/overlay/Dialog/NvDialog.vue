<template>
  <StDialogRoot v-model:open="dialogOpen" v-bind="props">
    <StDialogTrigger>
      <slot name="reference" />
    </StDialogTrigger>
    <Teleport :to="props.portalTarget">
      <div ref="newPortalTarget">
        <Transition class="transition">
          <StDialogBackdrop v-if="dialogOpen" />
        </Transition>
        <Transition class="transition">
          <!-- v-if causes this error:  https://github.com/vuejs/core/issues/5657-->
          <StDialogPositioner v-show="dialogOpen">
            <StDialogContentWrapper @click.self="closeDialog">
              <StDialogContent>
                <NvCard>
                  <NvStack spacing="5">
                    <NvGroup justify="between">
                      <StDialogTitle asChild>
                        <NvText type="title">
                          <slot name="title" />
                        </NvText>
                      </StDialogTitle>
                      <StDialogCloseTrigger>
                        <NvButton
                          icon-name="times"
                          size="xs"
                          squared
                          type="plain"
                        />
                      </StDialogCloseTrigger>
                    </NvGroup>
                    <StDialogDescription v-if="$slots.description">
                      <NvText>
                        <slot name="description" />
                      </NvText>
                    </StDialogDescription>
                    <slot name="footer" />
                  </NvStack>
                </NvCard>
              </StDialogContent>
            </StDialogContentWrapper>
          </StDialogPositioner>
        </Transition>
      </div>
    </Teleport>
  </StDialogRoot>
</template>
<script lang="ts" setup>
import { computed, defineEmits, defineProps, provide, ref } from 'vue'
import { props as propsDefinition } from './dialog.shared'
import NvCard from '@/components/display/Card/NvCard.vue'
import NvButton from '@/components/forms/Button/NvButton.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import NvText from '@/components/typography/Text/NvText.vue'
import {
  StDialogBackdrop,
  StDialogCloseTrigger,
  StDialogContent,
  StDialogContentWrapper,
  StDialogDescription,
  StDialogPositioner,
  StDialogRoot,
  StDialogTitle,
  StDialogTrigger,
} from './dialog.styled'

const newPortalTarget = ref()
provide('portal-target', newPortalTarget)

const props = defineProps({
  ...propsDefinition,
  modelValue: {
    type: Boolean,
    default: undefined,
  },
})

const emit = defineEmits(['update:modelValue'])

const localOpen = ref(false)

const dialogOpen = computed({
  get: () =>
    props.modelValue !== undefined ? props.modelValue : localOpen.value,
  set: (value) => {
    localOpen.value = value
    emit('update:modelValue', value)
  },
})

const closeDialog = (event: MouseEvent) => {
  if (event.target === event.currentTarget) {
    dialogOpen.value = false
  }
}
</script>
