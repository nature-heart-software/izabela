import {
  listVoicesHandler,
  synthesizeSpeechHandler,
} from '../controllers/ap-tts'

export const registerAPTTSRoutes = ({ app }) => {
  app.post('/api/tts/amazon-polly/list-voices', listVoicesHandler)
  app.post('/api/tts/amazon-polly/synthesize-speech', synthesizeSpeechHandler)
}
