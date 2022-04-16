import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/gc-tts'

export const registerGCTTSRoutes = ({ app }) => {
  app.post('/api/gc-tts/list-voices', listVoicesHandler)
  app.post('/api/gc-tts/synthesize-speech', synthesizeSpeechHandler)
}
