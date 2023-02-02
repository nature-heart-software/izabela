<template>
  <NvStack spacing="6">
    <NvStack>
      <NvCard>
        <NvStack>
          <NvText type="subtitle">Thank you for using the software!</NvText>
          <NvText>
            Izabela has been developed on my own free time over countless nights, weekends and even
            holidays for the
            past {{ years }}
            years.. It's been a passion project for so long and hearing
            about how it
            affected
            people's lives has been incredibly motivating!
          </NvText>
          <NvText>
            This is my gift to the world and I
            believe you'll make good use of it in turn! 🖤
          </NvText>
          <NvText>
            And please, if you enjoy the project, consider supporting me on <a
            href="https://ko-fi.com/woowee" target="_blank">Ko-fi</a> to help me maintain it! Any
            help is greatly appreciated!
          </NvText>
        </NvStack>
      </NvCard>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { NvCard, NvStack, NvText } from '@packages/ui'

const years = new Date().getFullYear()-2017 // wow this long?
</script>
