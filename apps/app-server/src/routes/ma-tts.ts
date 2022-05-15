import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/ma-tts'

export const registerMATTSRoutes = ({ app }) => {
  app.post('/api/tts/microsoft-azure/list-voices', listVoicesHandler)
  app.post(
    '/api/tts/microsoft-azure/synthesize-speech',
    synthesizeSpeechHandler,
  )
}
