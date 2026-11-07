<template>
  <NvTooltip :class="css({ display: 'inline-flex' })">
    <NvText>Homepage</NvText>
    <template #reference>
      <NvButton
        as="a"
        href="https://github.com/nature-heart-software/izabela"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Homepage"
        icon-name="info"
        type="plain"
      />
    </template>
  </NvTooltip>
  <NvCard size="xs">
    <NvGroup :spacing="2" noWrap>
      <NvTooltip>
        <NvText>Visit GitHub page</NvText>
        <template #reference>
          <NvButton
            as="a"
            href="https://github.com/nature-heart-software/izabela"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Visit GitHub page"
            icon-name="github-alt"
            size="sm"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Follow on Twitter</NvText>
        <template #reference>
          <NvButton
            as="a"
            href="https://twitter.com/joyfuldeceased"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Follow on Twitter"
            icon-name="twitter-alt"
            size="sm"
          />
        </template>
      </NvTooltip>
      <NvTooltip>
        <NvText>Join the Discord</NvText>
        <template #reference>
          <NvButton
            as="a"
            href="https://discord.gg/BmWtmYmaeQ"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Join the Discord"
            icon-name="discord"
            size="sm"
          />
        </template>
      </NvTooltip>
    </NvGroup>
  </NvCard>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import { NvButton, NvCard, NvGroup, NvText, NvTooltip } from '@packages/ui'
</script>
