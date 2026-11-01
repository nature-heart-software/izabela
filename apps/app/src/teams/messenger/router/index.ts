import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'settings',
    path: '/settings',
    component: () => import('@/teams/messenger/views/NvSettings.vue'),
    children: [
      {
        name: 'settings-general',
        path: 'general',
        component: () =>
          import('@/teams/messenger/views/NvSettingsGeneral.vue'),
      },
      {
        name: 'settings-game-overlay',
        path: 'game-overlay',
        component: () =>
          import('@/teams/messenger/views/NvSettingsGameOverlay.vue'),
      },
      {
        name: 'settings-profiles',
        path: 'profiles',
        component: () =>
          import('@/teams/messenger/views/NvSettingsProfiles.vue'),
      },
      {
        name: 'settings-engine',
        path: 'engine',
        component: () => import('@/teams/messenger/views/NvSettingsEngine.vue'),
      },
      {
        name: 'settings-audio-outputs',
        path: 'audio-outputs',
        component: () =>
          import('@/teams/messenger/views/NvSettingsAudioOutputs.vue'),
      },
      {
        name: 'settings-audio-input',
        path: 'audio-input',
        component: () =>
          import('@/teams/messenger/views/NvSettingsAudioInput.vue'),
      },
      {
        name: 'settings-translation',
        path: 'translation',
        component: () =>
          import('@/teams/messenger/views/NvSettingsTranslation.vue'),
      },
      {
        name: 'settings-dictionary',
        path: 'dictionary',
        component: () =>
          import('@/teams/messenger/views/NvSettingsDictionary.vue'),
      },
      {
        name: 'settings-commands',
        path: 'commands',
        component: () =>
          import('@/teams/messenger/views/NvSettingsCommands.vue'),
      },
      {
        name: 'settings-about',
        path: 'about',
        component: () => import('@/teams/messenger/views/NvSettingsAbout.vue'),
      },
      {
        name: 'settings-support',
        path: 'support',
        component: () =>
          import('@/teams/messenger/views/NvSettingsSupport.vue'),
      },
    ],
  },
  {
    name: 'messages',
    path: '/messages',
    component: () => import('@/teams/messenger/views/NvMessages.vue'),
    children: [
      {
        name: 'messages-history',
        path: 'history',
        component: () =>
          import('@/teams/messenger/views/NvMessagesHistory.vue'),
      },
      {
        name: 'messages-shortcuts',
        path: 'shortcuts',
        component: () =>
          import('@/teams/messenger/views/NvMessagesShortcuts.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
