import { TranslationEngine } from './types'
import { createEngineManager } from '@/modules/engine-manager'

const TranslationEngineManager = () => createEngineManager<TranslationEngine>()
const instance = TranslationEngineManager()
export default instance
