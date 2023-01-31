# How to intercept websocket events?

Izabela runs a local websocket server enabling you to intercept different events.
You can use these events to trigger actions in other applications.

<img src="https://github.com/nature-heart-software/izabela/blob/dev/assets/hyiro-clip.gif?raw=true" alt="Hyiro's stream with text appearing" style="width: 100%"/>

By default, Izabela runs a websocket server on the address: `ws://localhost:7071`.

Here's a [code sample](https://glitch.com/edit/#!/radical-witty-blanket?path=src%2Fapp.jsx%3A11%3A49) using the
`message:start` event to trigger an action. Send any message from Izabela and the character in the example will react!

Here's a list of all the events you can intercept:

| Event           | Payload          | Trigger                                                                     |
| --------------- | ---------------- | --------------------------------------------------------------------------- |
| `message:load`  | `IzabelaMessage` | Triggered when a message started loading                                    |
| `message:start` | `IzabelaMessage` | Triggered when the audio for a message started playing                      |
| `message:end`   | `IzabelaMessage` | Triggered when the audio for a message stopped playing or an error occurred |
| `message:error` | `IzabelaMessage` | Triggered when an error occurred                                            |
