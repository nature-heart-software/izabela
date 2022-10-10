<template>
  <a href="https://github.com/nature-heart-software/izabela" target="_blank">
    <span class="hidden">GitHub</span>
    <NvButton icon-name="info" type="plain" />
  </a>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <a href="https://github.com/nature-heart-software/izabela" target="_blank">
        <span class="hidden">GitHub</span>
        <NvButton icon-name="github-alt" size="sm" />
      </a>
      <a href="https://twitter.com/wurielle" target="_blank">
        <span class="hidden">Twitter</span>
        <NvButton icon-name="twitter-alt" size="sm" />
      </a>
      <a href="https://discord.gg/BmWtmYmaeQ" target="_blank">
        <span class="hidden">Discord</span>
        <NvButton icon-name="discord" size="sm" />
      </a>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { NvButton, NvCard, NvGroup } from '@packages/ui'
</script>
