import type { AudioTranscription } from 'openai/resources/realtime/realtime'

export const ENGINE_ID = 'openai-speech-recognition' as const
export const ENGINE_NAME = 'OpenAI' as const
export const defaultModel = 'gpt-4o-transcribe'

// OpenAI 7.45: resources/realtime/realtime.d.ts, AudioTranscription.model.
export const models: NonNullable<AudioTranscription['model']>[] = [
  'gpt-transcribe',
  'gpt-live-transcribe',
  'gpt-realtime-whisper',
  'gpt-4o-transcribe',
  'gpt-4o-transcribe-diarize',
  'gpt-4o-mini-transcribe',
  'gpt-4o-mini-transcribe-2025-12-15',
  'whisper-1',
]

export function getTranscriptionOptions(
  model: string,
  prompt: string,
  language: string,
): AudioTranscription {
  return {
    model,
    ...(model === 'gpt-live-transcribe' || model === 'gpt-transcribe'
      ? { languages: [language] }
      : { language }),
    ...(model === 'gpt-realtime-whisper' ||
    model === 'gpt-4o-transcribe-diarize'
      ? {}
      : { prompt }),
  }
}
