import { Module } from 'vuex'
import { utilActions, utilMutations } from '@/utils/vuex'
import { SpeechEngine } from '@/entities/speech/modules/speech-engine-manager/types'

const storeState = {
  persisted: {
    playSpeechOnDefaultPlaybackDevice: true,
    audioOutputDevices: [] as MediaDeviceInfo['deviceId'][],
    audioInputDevice: 'default' as MediaDeviceInfo['deviceId'],
    selectedSpeechEngine: 'saytts' as SpeechEngine['id'],
    autoUpdateChannel: 'latest',
    launchOnStartup: true,
    APTTSIdentityPoolId: '',
    APTTSRegion: '',
    APTTSSelectedVoice: {
      Gender: 'Female',
      Id: 'Amy',
      LanguageCode: 'en-GB',
      LanguageName: 'British English',
      Name: 'Amy',
      SupportedEngines: ['neural', 'standard'],
    },
    IWTTSApiKey: '',
    IWTTSUrl: '',
    IWTTSSelectedVoice: {
      gender: 'female',
      supported_features: {
        custom_pronunciation: true,
        voice_transformation: false,
      },
      name: 'en-US_AllisonV3Voice',
      customizable: true,
      description: 'Allison: American English female voice. Dnn technology.',
      language: 'en-US',
    },
    GCTTSApiKey: '',
    GCTTSSelectedVoice: {
      languageCodes: ['en-GB'],
      ssmlGender: 'FEMALE',
      name: 'en-GB-Wavenet-A',
    },
    MATTSApiKey: '',
    MATTSRegion: '',
    MATTSSelectedVoice: {
      Name: 'Microsoft Server Speech Text to Speech Voice (en-US, AshleyNeural)',
      DisplayName: 'Ashley',
      LocalName: 'Ashley',
      ShortName: 'en-US-AshleyNeural',
      Gender: 'Female',
      Locale: 'en-US',
      SampleRateHertz: '24000',
      VoiceType: 'Neural',
      Status: 'GA',
    },
    SayTTSSelectedVoice: null,
  },
}

export const settingsStore: Module<typeof storeState, any> = {
  namespaced: true,
  state: storeState,
  getters: {
    state: (state) => state,
    persisted: (state) => state.persisted,
  },
  mutations: {
    ...utilMutations,
  },
  actions: {
    ...utilActions,
  },
}

export default settingsStore
