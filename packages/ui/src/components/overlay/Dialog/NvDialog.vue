<template>
  <StDialogRoot v-bind="props">
    <StDialogTrigger>
      <slot name="reference" />
    </StDialogTrigger>
    <Teleport :to="props.portalTarget">
      <StDialogBackdrop />
      <StDialogPositioner>
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
                  <NvButton icon-name="times" size="xs" squared type="plain" />
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
      </StDialogPositioner>
    </Teleport>
  </StDialogRoot>
</template>
<script lang="ts" setup>
import { defineProps } from 'vue'
import { props as propsDefinition } from './dialog.shared'
import NvCard from '@/components/display/Card/NvCard.vue'
import NvButton from '@/components/forms/Button/NvButton.vue'
import NvGroup from '@/components/miscellaneous/Group/NvGroup.vue'
import NvStack from '@/components/miscellaneous/Stack/NvStack.vue'
import NvText from '@/components/typography/Text/NvText.vue'
import {
  StDialogCloseTrigger,
  StDialogTitle,
  StDialogBackdrop,
  StDialogContent,
  StDialogDescription,
  StDialogPositioner,
  StDialogRoot,
  StDialogTrigger,
} from './dialog.styled'

const props = defineProps(propsDefinition)
</script>
