<p align="center">
    <img alt="Izabela Logo" src="https://raw.githubusercontent.com/nature-heart-software/izabela/dev/apps/app/build/icons/64x64.png" width="64" height="64">
</p>

<h1 align="center">
  Izabela
</h1>

<p align="center">
  Your speech Assistant ✨
</p>

<p align="center">
    <img alt="Izabela Example" src="https://github.com/nature-heart-software/izabela/blob/dev/assets/izabela-example.gif?raw=true">
</p>

## What is Izabela?

Izabela is a text-to-speech application that allows you to communicate with an artificial voice on your speakers or
as an audio input!

It was designed primarily to help mute people and people with speech disabilities communicate with their friends over
applications such as Discord or games that don't include text chat without interrupting their activity. Over time, it
evolved to be a tool for anyone
who wants to communicate with text-to-speech and for that reason, you can see Izabela as a sort of speech assistant!

## Features

- [x] Appears above any non-fullscreen application
- [x] Multiple text-to-speech engines (Amazon Polly, Microsoft Azure, Google Cloud, IBM Watson,
      etc..) - [see list](#available-engines)
- [x] Multiple voices (per engine)
- [x] Multiple audio outputs
- [x] Supports audio inputs for speech-to-text-to-speech
- [x] Keyboard shortcuts for quick messages
- [x] Voice expressions (Microsoft Azure)
- [x] Download messages to audio files
- [x] Dictionary to translate abbreviations (ily -> I love you (💖))
- [x] Local and remote servers to help you build your own text-to-speech implementations
- [x] Local websocket server to retrieve messages (useful for streaming elements!)

## How to use

By default, press `Ctrl` + `Enter` to open Izabela.

The text input will be focused allowing you to type your message and send it. The selected text-to-speech engine will
translate your text into audio using the selected voice. The audio is then sent through every audio outputs you have
configured.

<img src="https://github.com/nature-heart-software/izabela/blob/dev/assets/wuriko-clip.gif?raw=true" alt="Izabela appearing over the game Overwatch 2"/>

If you have a virtual audio cable installed, you can configure it as an audio output in Izabela then use it as audio
input in any application that can receive audio inputs. If you don't have a virtual audio cable installed,
you can install one directly from Izabela in the settings.

You can keep using any non-fullscreen application in the background while Izabela is in the foreground. If you're
using Izabela over games, I recommend setting your game to `borderless`, `windowed` or `borderless windowed` mode
instead of
fullscreen.

## Support

Credentials for the more advanced text-to-speech engines are not provided by default. If you don't want to bother
configuring them for each engine, I provide universal
API keys to all "Supporter" members or above on my [Ko-fi](https://ko-fi.com/woowee/tiers)!

You can see the list of engines that are included with universal credentials in
the [Available engines](#available-engines) section.

> **Note:** The Izabela engine is only available to "Supporter" members or above
> on [Ko-fi](https://ko-fi.com/woowee/tiers).

If you prefer configuring your credentials yourself, you can do so by following the guides in the [Guides](#guides)
section (coming soon).

## Available engines

Here's a list of all the text-to-speech engines that are supported in Izabela:

| Engine                     | Included with Universal Credentials | Samples                                                                                                                               | Credits                                                                       |
| -------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Izabela (multiple engines) | Yes                                 | ![Izabela engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/izabela-sample.mp3)                         | https://github.com/Weilbyte/tiktok-tts                                        |
| Amazon Polly               | Yes                                 | ![Amazon Polly engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/amazon-polly-sample.mp3)               | https://aws.amazon.com/polly/                                                 |
| Google Cloud TTS           | Yes                                 | ![Google Cloud TTS engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/google-cloud-tts-sample.mp3)       | https://cloud.google.com/text-to-speech                                       |
| IBM Watson TTS             | Yes                                 |                                                                                                                                       | https://www.ibm.com/cloud/watson-text-to-speech                               |
| Microsoft Azure TTS        | Yes                                 | ![Microsoft Azure TTS engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/microsoft-azure-tts-sample.mp3) | https://azure.microsoft.com/en-us/products/cognitive-services/text-to-speech/ |
| Say                        | Included by default                 | ![Say engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/say-sample.mp3)                                 | https://github.com/Marak/say.js/                                              |
| Sam                        | Included by default                 | ![Sam engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/sam-sample.mp3)                                 | https://github.com/discordier/sam                                             |
| Animalese                  | Included by default                 | ![Animalese engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/animalese-sample.wav)                     | https://github.com/Acedio/animalese.js                                        |
| ElevenLabs                 | No                                  | ![ElevenLabs engine sample](https://github.com/nature-heart-software/izabela/blob/dev/assets/elevenlabs-sample.mp3)                   | https://beta.elevenlabs.io/speech-synthesis                                   |

## Guides

- [How to use Izabela as audio input](https://github.com/nature-heart-software/izabela/blob/dev/guides/onboarding/how-to-use-as-audio-input.md)
- [How to intercept websocket events](https://github.com/nature-heart-software/izabela/blob/dev/guides/onboarding/how-to-intercept-websocket-events.md)

## Resources

- [Figma](https://www.figma.com/proto/U4A6IwSY8T4W2tm2agW92S/Izabela-v1.0.0?node-id=103%3A4&scaling=min-zoom&page-id=103%3A3&starting-point-node-id=103%3A4)
