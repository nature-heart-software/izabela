<template>
  <NvTooltip class="inline-flex">
    <NvText>Homepage</NvText>
    <template #reference>
      <a href="https://github.com/nature-heart-software/izabela" target="_blank">
        <span class="hidden">GitHub</span>
        <NvButton icon-name="info" type="plain"/>
      </a>
    </template>
  </NvTooltip>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvTooltip>
        <NvText>Visit GitHub page</NvText>
        <template #reference>
          <a href="https://github.com/nature-heart-software/izabela" target="_blank">
            <span class="hidden">GitHub</span>
            <NvButton icon-name="github-alt" size="sm"/>
          </a>
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Follow on Twitter</NvText>
        <template #reference>
          <a href="https://twitter.com/wurielle" target="_blank">
            <span class="hidden">Twitter</span>
            <NvButton icon-name="twitter-alt" size="sm"/>
          </a>
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Join the Discord</NvText>
        <template #reference>
          <a href="https://discord.gg/BmWtmYmaeQ" target="_blank">
            <span class="hidden">Discord</span>
            <NvButton icon-name="discord" size="sm"/>
          </a>
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'</script>
