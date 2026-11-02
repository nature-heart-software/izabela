<template>
  <NvTooltip :class="css({ display: 'inline-flex' })">
    <NvText>Homepage</NvText>
    <template #reference>
      <a
        href="https://github.com/nature-heart-software/izabela"
        target="_blank"
      >
        <span :class="css({ display: 'none' })">GitHub</span>
        <NvButton icon-name="info" type="plain" />
      </a>
    </template>
  </NvTooltip>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvTooltip>
        <NvText>Visit GitHub page</NvText>
        <template #reference>
          <a
            href="https://github.com/nature-heart-software/izabela"
            target="_blank"
          >
            <span :class="css({ display: 'none' })">GitHub</span>
            <NvButton icon-name="github-alt" size="sm" />
          </a>
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Follow on Twitter</NvText>
        <template #reference>
          <a href="https://twitter.com/joyfuldeceased" target="_blank">
            <span :class="css({ display: 'none' })">Twitter</span>
            <NvButton icon-name="twitter-alt" size="sm" />
          </a>
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Join the Discord</NvText>
        <template #reference>
          <a href="https://discord.gg/BmWtmYmaeQ" target="_blank">
            <span :class="css({ display: 'none' })">Discord</span>
            <NvButton icon-name="discord" size="sm" />
          </a>
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
</script>
