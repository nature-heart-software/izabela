<template>
  <NvStack spacing="6">
    <NvStack>
      <NvGroup justify="between">
        <NvText type="subtitle">Profiles</NvText>
      </NvGroup>
      <NvStack spacing="4">
        <div>
          <NvButton size="sm" @click="profilesStore.addProfile"
            >Add profile
          </NvButton>
        </div>
        <template v-if="profilesStore.profiles.length === 0">
          <NvCard>
            <NvCenter>
              <NvText>No profiles</NvText>
            </NvCenter>
          </NvCard>
        </template>
        <template v-for="{ id } in profilesStore.profiles" :key="id">
          <NvProfileCard :id="id" />
        </template>
      </NvStack>
    </NvStack>
  </NvStack>
</template>
<script lang="ts" setup>
import {
  NvButton,
  NvCard,
  NvCenter,
  NvGroup,
  NvStack,
  NvText,
} from '@packages/ui'
import NvProfileCard from '@/teams/messenger/components/NvProfileCard.vue'
import { useProfilesStore } from '@/features/profiles/store.ts'

const profilesStore = useProfilesStore()
</script>
