import { createRouter, createWebHashHistory, RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    name: 'settings',
    path: '/settings',
    component: import('@/teams/messenger/views/NvSettings.vue'),
    children: [
      {
        name: 'settings-overview',
        path: 'overview',
        component: import('@/teams/messenger/views/NvSettingsOverview.vue')
      },
      {
        name: 'settings-speech',
        path: 'speech',
        component: import('@/teams/messenger/views/NvSettingsSpeech.vue')
      },
      {
        name: 'settings-audio',
        path: 'audio',
        component: import('@/teams/messenger/views/NvSettingsAudio.vue')
      },
    ]
  },
  {
    path: '/',
    redirect: {name: 'settings'}
  }
]

const router = createRouter({
  history: createWebHashHistory(process.env.BASE_URL),
  routes,
})

export default router
