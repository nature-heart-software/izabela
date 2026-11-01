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

## Troubleshooting

<details>
<summary>YouTube videos turn black when Izabela opens (Windows / Chrome)</summary>

Chrome's [native window occlusion detection](https://chromium.googlesource.com/chromium/src/+/main/docs/windows_native_window_occlusion_tracking.md)
can treat the browser as covered when Izabela appears, causing YouTube videos to
turn black. A workaround is to disable this detection in **Chrome**, not Izabela:

1. Right-click your Chrome shortcut and open **Properties**. For a pinned taskbar
   shortcut, right-click its icon, then right-click **Google Chrome** in the menu
   and choose **Properties**.
2. In **Target**, append the following flag after the closing quote, separated by
   a space. Keep your existing Chrome executable path:

   ```text
   "C:\Program Files\Google\Chrome\Application\chrome.exe" --disable-features=CalculateNativeWinOcclusion
   ```

3. Click **Apply**, fully exit Chrome (including any background Chrome processes),
   and reopen it using that shortcut. The flag will not take effect if Chrome
   reuses an already-running browser process.

This is a browser-side workaround, not an Izabela fix. It applies to Chrome windows
started with that flag and may increase resource usage while they are covered by
other windows. To undo it, remove `--disable-features=CalculateNativeWinOcclusion`
from the shortcut, fully exit Chrome, and reopen it.

</details>

## More from the community

- [its5Q/izabela-engines](https://github.com/its5Q/izabela-engines) - A small framework for quick development of your
  own custom engines for Izabela

## Resources

- [Figma](https://www.figma.com/proto/U4A6IwSY8T4W2tm2agW92S/Izabela-v1.0.0?node-id=103%3A4&scaling=min-zoom&page-id=103%3A3&starting-point-node-id=103%3A4)

## Development

Desktop development and packaging are supported on Windows x64. Install these prerequisites:

- Node 24 (see `.nvmrc`)
- pnpm 11 (`npm install --global pnpm@11.2.2`); the repository pins its package manager version
- [Python 3.11](https://github.com/nodejs/node-gyp?tab=readme-ov-file#configuring-python-dependency)
- [Visual Studio Build Tools 2022](https://github.com/nodejs/node-gyp?tab=readme-ov-file#on-windows) with the following components:
  - **Desktop development with C++** workload (`Microsoft.VisualStudio.Workload.VCTools`)
  - **C++ Clang Compiler for Windows** (`Microsoft.VisualStudio.ComponentGroup.NativeDesktop.Llvm.Clang`) — required for Node 24+
- [CMake 3.15+](https://cmake.org/download/) on `PATH`, required to compile the game overlay

From the repository root, start development with:

```sh
pnpm install
pnpm serve
```

To build the Electron app and Windows installer:

```sh
pnpm install
pnpm build
```

The output is in `apps/app/dist_electron` (installer and `win-unpacked` app).
Workspace packages build automatically in dependency order. Installation applies
dependency patches and compiles native workspace modules; serving and packaging
rebuild native modules for the app's Electron version. No separate preparation,
package build, environment file, or credential setup is required to launch the app.
Credentials are only needed for speech services that require them.

To verify native modules in Electron, run `pnpm test:native`. After packaging, run
`pnpm test:native apps/app/dist_electron/win-unpacked/resources/app.asar` to verify
the packaged dependencies and unpacked native binaries.

`pnpm test:serve` starts the development app, checks its HTTP response, local API,
overlay and renderer connections, rejects startup/shutdown errors, and stops its processes.
It bypasses Nx's task cache so that packages are compiled during validation.
Set `NX_SKIP_NX_CACHE=false` to check startup with caching enabled.
Windows CI builds the installer in a fresh checkout, then checks package
declarations, keyboard routing, and native runtime dependencies.

Native workspace builds and the Electron forcefocus rebuild are cached by their
source, lockfile, Node/Electron versions, OS/architecture, compiler options and
installed toolchain. Only runtime binaries and package outputs are restored;
generated compiler projects and intermediate files are rebuilt on a cache miss.
`pnpm test:native-cache` builds with an empty Nx cache, deletes the outputs, checks
that cache hits restore identical binaries, verifies compiler-option invalidation,
and loads the restored modules in Electron.

### Downloadable builds without updates

In GitHub **Actions → Downloadable app build → Run workflow**, select the branch
and run the workflow. After it succeeds, download
`izabela-next-setup-<version>-win.exe` directly from the run's **Artifacts** section.
The installer keeps its original filename and is not wrapped in a ZIP. Artifacts
are retained for 14 days and require a GitHub login to download.

These builds disable both normal update checks and startup-error recovery updates.
Update controls are unavailable without changing your saved preference; regular
builds retain their usual update behavior. The installer uses the normal app
identity and settings, so installing it can replace an existing installation.
Install a newer build manually when needed.

The workflow runs only on demand, uses the existing `APP_ENCRYPTION_KEY` repository
secret for settings compatibility, and does not publish a release.
