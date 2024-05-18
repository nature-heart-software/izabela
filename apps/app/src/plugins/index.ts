import { watchHitbox } from '@/modules/vue-hitboxes'

watchHitbox('.el-select-dropdown')
watchHitbox('.tippy-box')
watchHitbox('.autocomplete')
watchHitbox('#vjt-tooltip')

import.meta.glob('./**/register.ts', { eager: true })
