import textToSpeech from '@google-cloud/text-to-speech'
import NodeCache from "node-cache"

const client = new textToSpeech.TextToSpeechClient()
const cache = new NodeCache({ stdTTL: 10800, checkperiod: 120 })

const getSynthesizeSpeechCacheKey = ({ voice, input }) => {
    return `gctts | ${ voice.name } | ${ voice.ssmlGender } | ${ input.text }`
}

const getListVoicesCacheKey = ({}) => {
    return `gctts | listVoices`
}

export const listVoices = async (params) => {
    const cacheKey = getListVoicesCacheKey(params)
    const cachedResponse = cache.get(cacheKey)
    if (cachedResponse) {
        return cachedResponse
    }
    const [response] = await client.listVoices(params)
    cache.set(cacheKey, response)
    return response
}

export const synthesizeSpeech = async (params) => {
    const cacheKey = getSynthesizeSpeechCacheKey(params)
    const cachedResponse = cache.get(cacheKey)
    if (cachedResponse) {
        return cachedResponse
    }
    const [response] = await client.synthesizeSpeech(params)
    cache.set(cacheKey, response)
    return response
}

