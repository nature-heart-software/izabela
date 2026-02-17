<p align="center">
    <img alt="Izabela Logo" src="https://raw.githubusercontent.com/nature-heart-software/izabela/dev/apps/app/build/icons/64x64.png" width="64" height="64">
</p>

<h1 align="center">
  Izabela
</h1>

<p align="center">
  Your speech assistant ✨
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
- [x] Supports custom text-to-speech
      engines [(see example)](https://github.com/nature-heart-software/izabela/tree/dev/examples/custom-engine-api)
- [x] Multiple audio outputs
- [x] Supports audio inputs for speech-to-text-to-speech
- [x] Keyboard shortcuts for quick messages
- [x] Voice expressions (Microsoft Azure)
- [x] Download messages to audio files
- [x] Translate messages into any language
- [x] Dictionary to translate abbreviations (ily -> I love you (💖))
- [x] Local and remote servers to help you build your own text-to-speech implementations
- [x] Local websocket server to retrieve messages & timestamps (useful for streaming elements!)

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

You can press `Ctrl` + `Enter` (or `Esc` if the text input is focused) to close the window.
Pressing `Enter` while the text input is focused and no text is present will also close the window.

## Support

Credentials for the more advanced text-to-speech engines are not provided by default. If you don't want to bother
configuring them for each engine, I provide universal
API keys to all "Supporter" members or above on my [Ko-fi](https://ko-fi.com/woowee/tiers)!

You can see the list of engines that are included with universal credentials in
the [Available engines](#available-engines) section.

> **Note:** The Izabela engine is only available to "Supporter" members or above
> on [Ko-fi](https://ko-fi.com/woowee/tiers).

If you prefer configuring your credentials yourself, you can do so by following the guides on
the [Wiki](https://github.com/nature-heart-software/izabela/wiki)
page.

## Available engines

Here's a list of all the text-to-speech engines that are supported in Izabela:

| Engine                     | Included with Universal credentials | Sample                                                                                                           | Credits                                                                       |
| -------------------------- | ----------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Izabela (multiple engines) | Yes                                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/izabela-sample.mp3?raw=true)         | https://github.com/Weilbyte/tiktok-tts                                        |
| Amazon Polly               | Yes                                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/amazon-polly-sample.mp3?raw=true)    | https://aws.amazon.com/polly/                                                 |
| Google Cloud TTS           | Yes                                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/google-cloud-sample.mp3?raw=true)    | https://cloud.google.com/text-to-speech                                       |
| IBM Watson TTS             | Yes                                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/ibm-watson-sample.mpeg?raw=true)     | https://www.ibm.com/cloud/watson-text-to-speech                               |
| Microsoft Azure TTS        | Yes                                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/microsoft-azure-sample.mp3?raw=true) | https://azure.microsoft.com/en-us/products/cognitive-services/text-to-speech/ |
| Say                        | Included by default                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/say-sample.mp3?raw=true)             | https://github.com/Marak/say.js/                                              |
| Sam                        | Included by default                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/sam-sample.mp3?raw=true)             | https://github.com/discordier/sam / https://github.com/Imrane03/better-sam    |
| Animalese                  | Included by default                 | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/animalese-sample.wav?raw=true)       | https://github.com/Acedio/animalese.js                                        |
| ElevenLabs                 | No                                  | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/elevenlabs-sample.mp3?raw=true)      | https://elevenlabs.io/                                                        |
| OpenAI                     | No                                  | [Download](https://github.com/nature-heart-software/izabela/blob/dev/assets/openai-sample.mp3?raw=true)          | https://openai.com/                                                           |

## Guides

Find guides and API documentation on the [Wiki](https://github.com/nature-heart-software/izabela/wiki) page.

## More from the community

- [its5Q/izabela-engines](https://github.com/its5Q/izabela-engines) - A small framework for quick development of your
  own custom engines for Izabela

## Resources

- [Figma](https://www.figma.com/proto/U4A6IwSY8T4W2tm2agW92S/Izabela-v1.0.0?node-id=103%3A4&scaling=min-zoom&page-id=103%3A3&starting-point-node-id=103%3A4)

## Development

The project requires the following in order to run:

- Node 22
- [Python 3.11](https://github.com/nodejs/node-gyp?tab=readme-ov-file#configuring-python-dependency)

### Windows

- [Visual Studio Build Tools 2022](https://github.com/nodejs/node-gyp?tab=readme-ov-file#on-windows)

### Linux

Install the following system dependencies before running `npm install`:

**Debian/Ubuntu:**
```bash
sudo apt install libx11-dev libxkbfile-dev libxdo-dev libasound2-dev sox
```

**Fedora/RHEL:**
```bash
sudo dnf install libX11-devel libxkbfile-devel libxdo-devel alsa-lib-devel sox
```

**Known limitations on Linux:**
- Game overlay is not available (requires DirectX)
- Raw mouse tracking is not available (Windows Raw Input API)
- Process watching is not available (Windows WMI)
- Virtual audio cable auto-installation is not available — use PulseAudio null sink (`pactl load-module module-null-sink`) or PipeWire equivalent instead
- Global key listener and native keymap require X11 (Wayland support is limited)
