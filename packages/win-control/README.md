# win-control
win-control aims at managing currently opened windows from nodejs, wrapping the native windows API.

This module is exclusively compatible with Windows.

## Usage

Install with yarn/npm
```
yarn add win-control
```
Then, library can be imported as follows.

```javascript
const {Window} = require('win-control')

// Set a window as foreground using the process identifier
Window.getByPid(PID).setForeground()
```

## Documentation

### Window.getByPid(PID)
Search a windows by the PID of the process

* `pid` `{number}` PID of the process owning the window.

Returns `undefined` if PID doesn't have an associated window, or an instance of [Window](#class-window).

### Window.getForeground()
Get current foreground window.

Returns an instance of [Window](#class-window).

### Window.getByClassName(className)
Search a windows by the class name of the window

* `className` `{string}` Classname of the window to look for.

Returns `undefined` if it could not be found, or an instance of [Window](#class-window).

### Window.getByTitle(title)
Search a windows by the title of the window, the coincidence must be exact

* `title` `{string}` Classname of the window to look for.

Returns `undefined` if it could not be found, or an instance of [Window](#class-window).

***

### Class: Window

#### Constructor: new Window(hwnd)

* `hwnd` `{number}` Identifier of the window to be managed.

#### #getParent()

Retrieves an instance of [Window](#class-window) with the specified window's parent or owner. It may returns `undefined` if class has not any parent.

#### #getAncestor(kindOfAncestor)

Retrieves an instance of [Window](#class-window) with the specified ancestor. It may returns `undefined` if class has not the specified ancestor.

* `kindOfAncestor` see [AncestorFlags](#ancestorflags)

#### #getProcessInfo()

Returns an object with information of the process who owns the window.

The object has the following properties.
* `windowText` `{string}` Window's title bar.
* `pid` `{number}` PID of the process who owns the window.
* `path` `{string}` Process's path who owns the window.

#### #getPid()

Returns a `number` with the PID of the owner of the window.

#### #getClassName()

Returns a `string` with the window's class name.

#### #getTitle()

Returns a `string` with the window's title bar (if it has one).

#### #exists()

Returns a `boolean` indicating if the window still exists

#### #isVisible()

Returns a `boolean` indicating if the window is visible

#### #getDimensions()

Retrieves the dimensions of the bounding rectangle of the specified window. The dimensions are given in screen coordinates that are relative to the upper-left corner of the screen.

The returned object has the following properties

* `left` `{number}` x-coordinate of the upper-left corner of the rectangle.
* `right` `{number}` x-coordinate of the lower-right corner of the rectangle.
* `top` `{number}` y-coordinate of the upper-left corner of the rectangle.
* `bottom` `{number}` y-coordinate of the lower-right corner of the rectangle.

#### #getHwnd()

Returns the hwnd of the current instance.

#### #moveRelative(dx, dy, dw, dh)

Changes the position and dimensions of the specified window

* `dx` `{number}` new position of the left side relative to current
* `dy` `{number}` new position of the top side relative to current
* `dw` `{number}` new width of the window relative to current
* `dh` `{number}` new height of the window relative to current

Returns a `boolean` indicating if the operation has succeeded

#### #setShowStatus(state)

Sets the specified window's show state.

* `state` See [WindowStates](#windowstates)

Returns a `boolean` indicating if the operation has succeeded

#### #setPosition(hwndInsertAfter, x, y, cx, cy, uFlags)

Changes the size, position, and Z order of the window.

* `hwndInsertAfter` `{number}` A HWND to precede the positioned window in the Z order or a value of [HWND](#hwnd)
* `x` `{number}`: new position of the left side of the window.
* `y` `{number}`: new position of the top of the window.
* `cx` `{number}`: new width in pixels.
* `cy` `{number}`: new height in pixels.
* `uFlags`: the window sizing and positioning flags. See [SWP](#swp)

Returns a `boolean` indicating if the operation has succeeded

#### #setForeground()

Brings the current window into the foreground and activates the window.

#### #close()

Closes current window.

## SWP

Exposed as:

```javascript
require('win-control').SWP
```

With the following properties

* `NOSIZE`: retains the current size (ignores the cx and cy parameters).
* `NOMOVE`: retains the current position (ignores X and Y parameters).
* `NOZORDER`: retains the current Z order.
* `NOREDRAW`: does not redraw changes. If this flag is set, no repainting of any kind occurs.
* `NOACTIVATE`: does not activate the window.
* `DRAWFRAME`: draws a frame around the window.
* `FRAMECHANGED`: applies new frame styles set.
* `SHOWWINDOW`: displays the window.
* `HIDEWINDOW`: hides the window.
* `NOCOPYBITS`: discards the entire contents of the client area.
* `NOOWNERZORDER`: does not change the owner window's position in the Z order
* `NOREPOSITION`: same as the NOOWNERZORDER flag.
* `NOSENDCHANGING`: prevents the window from receiving the WM_WINDOWPOSCHANGING message
* `DEFERERASE`: prevents generation of the WM_SYNCPAINT message.
* `ASYNCWINDOWPOS`: if the calling thread and the thread that owns the window are attached to different input queues, the system posts the request to the thread that owns the window.


## HWND

Exposed as:

```javascript
require('win-control').HWND
```

With the following properties

* `BOTTOM`: places the window at the bottom of the Z order.
* `NOTOPMOST`: places the window above all non-topmost windows (that is, behind all topmost windows).
* `TOP`: places the window at the top of the Z order.
* `TOPMOST`: places the window above all non-topmost windows. The window maintains its topmost position even when it is deactivated.

## AncestorFlags

Exposed as:

```javascript
require('win-control').AncestorFlags
```

With the following properties

* `PARENT`: retrieves the parent window.
* `ROOT`: retrieves the root window by walking the chain of parent windows.
* `ROOTOWNER`: retrieves the owned root window by walking the chain of parent and owner windows.

## WindowStates

Exposed as:

```javascript
require('win-control').WindowStates
```

With the following properties

* `HIDE`: hides the window and activates another window.
* `SHOWNORMAL`: activates and displays a window
* `SHOWMINIMIZED`: activates the window and displays it as a minimized window.
* `MAXIMIZE`: maximizes the specified window.
* `SHOWMAXIMIZED`: activates the window and displays it as a maximized window.
* `SHOWNOACTIVATE`: displays a window in its most recent size and position.
* `SHOW`: activates the window and displays it in its current size and position.
* `MINIMIZE`: minimizes the specified window and activates the next top-level window in the Z order.
* `SHOWMINNOACTIVE`: displays the window as a minimized window.
* `SHOWNA`: displays the window in its current size and position
* `RESTORE`: activates and displays the window. If the window is minimized or maximized, the system restores it to its original size and position
* `SHOWDEFAULT`: sets the show state based on the SW_ value specified in the STARTUPINFO structure passed to the CreateProcess function by the program that started the application.
* `FORCEMINIMIZE`: minimizes a window, even if the thread that owns the window is not responding.

## Examples

For more information on uses, please see [example](example/index.js).

## Contributing

Bug reports and merge requests are welcome on Github at
https://github.com/nosolosoftware/win-control using
[GitHub Flow](https://guides.github.com/introduction/flow/index.html). This project is intended to
be a safe, welcoming space for collaboration, and contributors are expected to adhere to the
[Contributor Covenant](http://contributor-covenant.org) code of conduct.


## Versioning

**win-control** uses [Semantic Versioning 2.0.0](http://semver.org)

## Generating a new version

In order to publish a new version you need to define `NODE_PRE_GYP_GITHUB_TOKEN` as environmental variable.

* Bump version at package.json
* yarn node-pre-gyp clean configure build package
* yarn node-pre-gyp-github publish --release
* npm publish

## License

Copyright (c) 2019-2020 NoSoloSoftware Network S.L. - Released under [MIT](LICENSE) license.
