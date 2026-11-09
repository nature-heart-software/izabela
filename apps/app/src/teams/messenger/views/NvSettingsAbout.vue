<template>
  <NvStack spacing="6">
    <NvStack>
      <NvText type="subtitle">About</NvText>
      <NvStack :spacing="4">
        <NvCard>
          <NvGroup align="start" justify="apart" no-wrap>
            <NvStack>
              <NvText type="subtitle">Wiki</NvText>
              <NvText>
                You can visit the Wiki page on GitHub to learn more about the
                project and how to use it.
              </NvText>
            </NvStack>
            <a
              :class="css({ flexShrink: 0 })"
              href="https://github.com/nature-heart-software/izabela/wiki"
              target="_blank"
            >
              <NvButton> Visit Wiki</NvButton>
            </a>
          </NvGroup>
        </NvCard>
        <NvCard>
          <NvStack spacing="5">
            <template v-for="(value, key, i) in info" :key="key">
              <NvDivider v-if="i > 0" direction="horizontal" />
              <NvGroup no-wrap>
                <NvText :class="css({ width: '50%' })" type="label">{{
                  key
                }}</NvText>
                <NvText :class="css({ width: '50%' })">{{ value }}</NvText>
              </NvGroup>
            </template>
          </NvStack>
        </NvCard>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import { css } from '@/styled-system/css'
import {
  NvButton,
  NvCard,
  NvDivider,
  NvGroup,
  NvStack,
  NvText,
} from '@packages/ui'
import { useGetAppInfoQuery } from '@/features/app/queries.ts'

const { data: info } = useGetAppInfoQuery()
</script>
