<p align="center">
    <img alt="Izabela" src="https://raw.githubusercontent.com/nature-heart-software/izabela/dev/apps/app/build/icons/64x64.png" width="64" height="64">
</p>

<h1 align="center">
  Izabela
</h1>

<p align="center">
  Your speech Assistant ✨
</p>

## What is Izabela?

Izabela is a text-to-speech application that allows you to communicate with an artificial voice through your speakers or
as your microphone!

It was designed primarily to help mute people and people with speech disabilities communicate with their friends over
applications such as Discord or games that don't include text chat without interrupting their activity. Over time, it
evolved to be a tool for anyone
who wants to communicate with text-to-speech and for that reason, you can see Izabela as a sort of speech assistant!

## Features

- [x] Appears above any non-fullscreen application
- [x] Multiple text-to-speech engines (Amazon Polly, Microsoft Azure, Google Cloud, IBM Watson, etc..)
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

If you have a virtual audio cable installed, you can configure it as an audio output in Izabela then use it as audio
input in any application that can receive audio inputs. If you don't have a virtual audio cable installed,
you can install one directly in Izabela from the settings.

You can keep using any non-fullscreen application in the background while Izabela is in the foreground. If you're
using Izabela over games, I recommend setting your game in borderless, windowed or borderless windowed mode instead of
fullscreen.

## Guides

- [How to use Izabela as audio input](https://github.com/nature-heart-software/izabela/blob/dev/guides/onboarding/how-to-use-as-audio-input.md)
- [How to intercept websocket events](https://github.com/nature-heart-software/izabela/blob/dev/guides/onboarding/how-to-intercept-websocket-events.md)

## Resources

- [Figma](https://www.figma.com/proto/U4A6IwSY8T4W2tm2agW92S/Izabela-v1.0.0?node-id=103%3A4&scaling=min-zoom&page-id=103%3A3&starting-point-node-id=103%3A4)
