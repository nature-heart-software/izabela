import { resetBoundaries } from './boundaries'
import { createRequire } from 'node:module'
import net from 'node:net'
import https from 'node:https'
import childProcess from 'node:child_process'
import { beforeEach, describe, expect, it } from 'vitest'
const require = createRequire(import.meta.url)
beforeEach(resetBoundaries)

describe('installed SDK public contracts behind controlled boundaries', () => {
  it('matches actual AWS command input and client send API without constructing a credentialed client', () => {
    const sdk =
      require('@aws-sdk/client-polly') as typeof import('@aws-sdk/client-polly')
    expect(sdk.Polly.prototype.send).toBeTypeOf('function')
    expect(
      new sdk.SynthesizeSpeechCommand({
        Text: 'hello',
        VoiceId: 'Joanna',
        OutputFormat: 'mp3',
      }).input,
    ).toEqual({ Text: 'hello', VoiceId: 'Joanna', OutputFormat: 'mp3' })
    expect(
      require('@aws-sdk/credential-provider-cognito-identity')
        .fromCognitoIdentityPool,
    ).toBeTypeOf('function')
  })
  it('matches Azure factory, callback synthesis, timestamps and close methods', () => {
    const sdk =
      require('microsoft-cognitiveservices-speech-sdk') as typeof import('microsoft-cognitiveservices-speech-sdk')
    expect(sdk.SpeechConfig.fromSubscription).toBeTypeOf('function')
    const config = sdk.SpeechConfig.fromSubscription('fixture-key', 'westus')
    expect(config.requestWordLevelTimestamps).toBeTypeOf('function')
    expect(sdk.SpeechSynthesizer.prototype.speakTextAsync).toBeTypeOf(
      'function',
    )
    expect(sdk.SpeechSynthesizer.prototype.speakSsmlAsync).toBeTypeOf(
      'function',
    )
    expect(sdk.SpeechSynthesizer.prototype.close).toBeTypeOf('function')
    expect(
      sdk.SpeechSynthesisOutputFormat.Audio24Khz160KBitRateMonoMp3,
    ).toBeTypeOf('number')
  })
  it('matches IBM SDK/auth, ws EventTarget properties and say callback exports without provider construction', () => {
    const Watson =
      require('ibm-watson/text-to-speech/v1') as typeof import('ibm-watson/text-to-speech/v1')
    expect(Watson.prototype.listVoices).toBeTypeOf('function')
    expect(Watson.prototype.synthesize).toBeTypeOf('function')
    const auth = require('ibm-watson/auth') as typeof import('ibm-watson/auth')
    expect(auth.IamAuthenticator).toBeTypeOf('function')
    expect(auth.IamTokenManager.prototype.getToken).toBeTypeOf('function')
    const WebSocket = require('ws') as typeof import('ws').WebSocket
    expect(WebSocket.prototype.send).toBeTypeOf('function')
    expect(
      Object.getOwnPropertyDescriptor(WebSocket.prototype, 'onmessage')?.set,
    ).toBeTypeOf('function')
    const say = require('say') as typeof import('say')
    expect(say.export).toBeTypeOf('function')
    expect(say.getInstalledVoices).toBeTypeOf('function')
    expect(childProcess.spawn).not.toHaveBeenCalled()
    expect(childProcess.exec).not.toHaveBeenCalled()
  })
  it('fails closed for unexpected HTTPS, fetch, sockets and native speech process execution', () => {
    expect(() => https.request('https://fixture.invalid')).toThrow(
      'Unexpected external',
    )
    expect(() => fetch('https://fixture.invalid')).toThrow(
      'Unexpected external',
    )
    expect(() => new net.Socket().connect(443, 'fixture.invalid')).toThrow(
      'Unexpected external',
    )
    expect(() => childProcess.exec('fixture')).toThrow('Unexpected external')
  })
})
