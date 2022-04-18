import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/gc-tts'

export const registerGCTTSRoutes = ({ app }) => {
  app.post('/api/tts/google-cloud/list-voices', listVoicesHandler)
  app.post('/api/tts/google-cloud/synthesize-speech', synthesizeSpeechHandler)
}
