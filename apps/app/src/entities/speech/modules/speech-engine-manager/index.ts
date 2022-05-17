import speechEngineManager from './SpeechEngineManager'

function requireAll(r: any) {
  r.keys().forEach(r)
}

requireAll(require.context('./speech-engines/', true, /\.ts$/))

export default speechEngineManager
