# How to use Izabela as an audio input?

Izabela can be used as an audio input on any application that can receive audio inputs.

You only need 2 things to make this work:

- A virtual audio cable installed
- The virtual audio cable configured as an audio output in Izabela

## Install a virtual audio cable from Izabela

> You can skip this step if you already have a virtual audio cable installed.

You can install a virtual audio cable directly from Izabela in the settings.

> Izabela uses [VB-Audio virtual cable](https://vb-audio.com/Cable/index.htm) as preferred virtual audio cable.

- Go to the settings
- Go to the `Audio` tab under `Speech`
- Under "Install VB-Audio Virtual Cable", click on the "Install" button to launch the installer

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/install-vac.png?raw=true)

- Follow the installer instructions
- Once installed, you should see the message "Virtual audio cable found"

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/vac-installed.png?raw=true)

> **Note:** A restart is required after installing the virtual audio cable.

## Or install a virtual audio cable manually

> You can skip this step if you already have a virtual audio cable installed.

If for some reasons you can't install the virtual audio cable from Izabela you can still install the audio cable
manually through the official [VB-Audio website](https://vb-audio.com/index.htm).

- Visit the [VB-Audio virtual cable page](https://vb-audio.com/Cable/index.htm) and download the latest version of the
  virtual
  audio cable
- Unzip the downloaded file
- Run the installer as **ADMINISTRATOR** (`VBCable_Setup_x64.exe` for 64-bit systems or `VBCable_Setup.exe` for 32-bit
  systems)
- Follow the installer instructions
- Once installed, go to the settings in Izabela
- Go to the `Audio` tab under `Speech` and you should see the message "Virtual audio cable found" under "Install
  VB-Audio Virtual Cable"

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/vac-installed.png?raw=true)

> **Note:** A restart is required after installing the virtual audio cable.

## Select the virtual audio cable

- Select the virtual audio cable as an audio output in Izabela

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/select-vac.png?raw=true)

- Then in any application that accepts audio inputs, select the virtual audio cable as an audio input

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/select-audio-input.png?raw=true)

If all the steps above were followed correctly, you should be able to see audio being sent to the target application
after sending a message from Izabela

![](https://github.com/nature-heart-software/izabela/blob/dev/assets/mic-test.png?raw=true)
