import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/say-tts'

export const registerSayTTSRoutes = ({ app }) => {
  app.get('/api/tts/say/list-voices', listVoicesHandler)
  app.post('/api/tts/say/list-voices', listVoicesHandler)
  app.post('/api/tts/say/synthesize-speech', synthesizeSpeechHandler)
}
