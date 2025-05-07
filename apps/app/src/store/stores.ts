import { useSpeechRecognitionStore, useSpeechStore } from '@/features/speech/store'
import { useHitboxesStore } from '@/modules/vue-hitboxes/hitboxes.store.ts'
import { useConfirmStore } from '@/store/use-confirm-store.ts'
import { useDatabasesStore } from '@/features/databases/store'
import { useDictionaryStore } from '@/features/dictionary/store'
import { useMessagesStore, usePlayingMessageStore } from '@/features/messages/store.ts'
import { useMessengerStore } from '@/teams/messenger/store'
import { useProfilesStore } from '@/features/profiles/store.ts'
import { useSettingsStore } from '@/features/settings/store'
import { useGameOverlayStore } from '@/features/game-overlay/store'
import SpeechRecognitionEngineManager from '@/modules/speech-recognition-engine-manager'
import SpeechEngineManager from '@/modules/speech-engine-manager'
import TranslationEngineManager from '@/modules/translation-engine-manager'
import { storesStates } from '@/store/index.ts'

const hooks = {
  useSpeechStore,
  useHitboxesStore,
  useConfirmStore,
  useDatabasesStore,
  useDictionaryStore,
  useMessagesStore,
  useMessengerStore,
  useProfilesStore,
  useSettingsStore,
  useGameOverlayStore,
  useSpeechRecognitionStore,
  usePlayingMessageStore,
}

export const stores = new Map<keyof typeof hooks, (typeof hooks)[keyof typeof hooks]>()
Object.entries(hooks).forEach(([key, value]) => stores.set(key as keyof typeof hooks, value))

export function loadStores() {
  Array.from(stores.values()).map((s) => s())
  Array.from(SpeechEngineManager.getEngines()).map((e) => e.store.getState())
  Array.from(SpeechRecognitionEngineManager.getEngines()).map((e) => e.store.getState())
  Array.from(TranslationEngineManager.getEngines()).map((e) => e.store.getState())
  return Promise.all(
    Object.values(storesStates).map((storeStates) => storeStates.$whenReady()),
  )
}