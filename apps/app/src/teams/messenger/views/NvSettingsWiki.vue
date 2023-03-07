<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">Wiki</NvText>
      <NvCard>
        <NvGroup align="start" justify="apart" no-wrap>
          <NvStack>
            <NvText type="subtitle">Wiki</NvText>
            <NvText>
              You can visit the Wiki page on GitHub to learn more about the project and how to use
              it.
            </NvText>
          </NvStack>
          <a
            class="shrink-0"
            href="https://github.com/nature-heart-software/izabela/wiki"
            target="_blank"
          >
            <NvButton> Visit Wiki </NvButton>
          </a>
        </NvGroup>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvStack, NvText } from '@packages/ui'
</script>
