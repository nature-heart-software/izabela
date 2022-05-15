import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/iw-tts'

export const registerIWTTSRoutes = ({ app }) => {
  app.post('/api/tts/ibm-watson/list-voices', listVoicesHandler)
  app.post('/api/tts/ibm-watson/synthesize-speech', synthesizeSpeechHandler)
}
