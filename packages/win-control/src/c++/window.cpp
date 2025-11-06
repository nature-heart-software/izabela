#include <windows.h>
#include <psapi.h>
#include <string>
#include <iostream>
#include <napi.h>

#include "window.hpp"

Napi::FunctionReference Window::constructor;

Window::Window(const Napi::CallbackInfo &info) : Napi::ObjectWrap<Window>(info) {
  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::Error::New(info.Env(), "The HWND of the window has to be specified.").ThrowAsJavaScriptException();
    return;
  }

  this->_identifier = (HWND)IntToPtr(info[0].ToNumber().Int32Value());
}

Napi::Value Window::GetForeground(const Napi::CallbackInfo &info) {
  HWND fgWin = GetForegroundWindow();

  return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(fgWin)) });
}

Napi::Value Window::GetByClassName(const Napi::CallbackInfo& info) {
  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::Error::New(info.Env(), "ClassName must be specified.").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  std::string className = info[0].ToString().Utf8Value();

  HWND fgWin = FindWindowEx(0, 0, className.c_str(), 0);

  if (fgWin == NULL) return info.Env().Undefined();

  return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(fgWin)) });
}

Napi::Value Window::GetByTitle(const Napi::CallbackInfo& info) {
  if (info.Length() != 1 || !info[0].IsString()) {
    Napi::Error::New(info.Env(), "Title must be specified.").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  std::string exactTitle = info[0].ToString().Utf8Value();

  HWND fgWin = FindWindow(NULL, exactTitle.c_str());

  if (fgWin == NULL) return info.Env().Undefined();

  return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(fgWin)) });
}

Napi::Value Window::GetByPid(const Napi::CallbackInfo& info) {
  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::Error::New(info.Env(), "PID must be specified.").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  PidHwnd data;
  data.pid = info[0].ToNumber().Uint32Value();
  data.hwnd = 0;
  EnumWindows(&Window::EnumWindowsCallback, (LPARAM)&data);

  if (data.hwnd == NULL) {
    return info.Env().Undefined();
  } else {
    return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(data.hwnd)) });
  }
}

BOOL CALLBACK Window::EnumWindowsCallback(HWND handle, LPARAM lParam) {
  PidHwnd& data = *(PidHwnd*)lParam;
  unsigned long pid = 0;
  GetWindowThreadProcessId(handle, &pid);

  if (data.pid != pid || !(GetWindow(handle, GW_OWNER) == (HWND)0 && IsWindowVisible(handle))) {
    return TRUE;
  }
  data.hwnd= handle;
  return FALSE;
}

Napi::Object Window::Init(Napi::Env env, Napi::Object exports) {
  Napi::Function func = DefineClass(
    env, "Window",
    {
      StaticMethod<&Window::GetForeground>("getForeground"),
      StaticMethod<&Window::GetByTitle>("getByTitle"),
      StaticMethod<&Window::GetByClassName>("getByClassName"),
      StaticMethod<&Window::GetByPid>("getByPid"),

      InstanceMethod("setForeground", &Window::SetForeground),
      InstanceMethod("setPosition", &Window::SetPosition),
      InstanceMethod("setShowStatus", &Window::SetShowStatus),
      InstanceMethod("moveRelative", &Window::MoveRelative),
      InstanceMethod("getHwnd", &Window::GetHwnd),
      InstanceMethod("getDimensions", &Window::GetDimensions),
      InstanceMethod("isVisible", &Window::IsVisible),
      InstanceMethod("exists", &Window::Exists),
      InstanceMethod("getTitle", &Window::GetTitle),
      InstanceMethod("getClassName", &Window::GetClassName),
      InstanceMethod("getPid", &Window::GetPid),
      InstanceMethod("getProcessInfo", &Window::GetProcessInfo),
      InstanceMethod("getAncestor", &Window::GetAncestor),
      InstanceMethod("getParent", &Window::GetParent),
      InstanceMethod("close", &Window::Close)
    });

  constructor = Napi::Persistent(func);

  exports.Set("Window", func);

  env.SetInstanceData<Napi::FunctionReference>(&constructor);

  return exports;
}

Napi::Value Window::SetForeground(const Napi::CallbackInfo& info) {
  // As the documentation of MSDN refers, setForeground has some caveats that doesn't allow to set
  // the foreground window, so we force it attaching to it
  bool returned = SetForegroundWindow(this->_identifier) || _forceForeground();

  return Napi::Boolean::New(info.Env(), returned);
}

Napi::Value Window::SetPosition(const Napi::CallbackInfo& info) {
  if (info.Length() != 6) {
    Napi::Error::New(info.Env(), "setPosition must be called passing setPosition(insertAfter, X, Y, cx, cy, uFlags)").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  for (int i = 0; i < 6; i++) {
    if (!info[i].IsNumber()) {
      Napi::Error::New(info.Env(), "Parameter at position of " + std::to_string(i) + " must be a number.").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
  }

  HWND insertAfter = (HWND)IntToPtr(info[0].ToNumber().Int32Value());
  int X = info[1].ToNumber().Int32Value();
  int Y = info[2].ToNumber().Int32Value();
  int cx = info[3].ToNumber().Int32Value();
  int cy = info[4].ToNumber().Int32Value();
  int uFlags = info[5].ToNumber().Int32Value();

  bool returned = SetWindowPos(this->_identifier, insertAfter, X, Y, cx, cy, uFlags);
  return Napi::Boolean::New(info.Env(), returned);
}


// Extracted from
// https://www.codeproject.com/Tips/76427/How-to-bring-window-to-top-with-SetForegroundWindo
bool Window::_forceForeground() {
  BYTE keyState[256] = {0};

  //to unlock SetForegroundWindow we need to imitate Alt pressing
  if (GetKeyboardState((LPBYTE)&keyState))  {
    if (!(keyState[VK_MENU] & 0x80))  {
      keybd_event(VK_MENU, 0, KEYEVENTF_EXTENDEDKEY | 0, 0);
    }
  }

  SetForegroundWindow(this->_identifier);

  if (GetKeyboardState((LPBYTE)&keyState))  {
    if (!(keyState[VK_MENU] & 0x80))  {
      keybd_event(VK_MENU, 0, KEYEVENTF_EXTENDEDKEY | KEYEVENTF_KEYUP, 0);
    }
  }
  return true;
}

Napi::Value Window::SetShowStatus(const Napi::CallbackInfo& info) {
  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::Error::New(info.Env(), "New status must be specified.").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  int status = info[0].ToNumber().Int32Value();

  bool returned = ShowWindow(this->_identifier, status);

  return Napi::Boolean::New(info.Env(), returned);
}

Napi::Value Window::MoveRelative(const Napi::CallbackInfo& info) {
  if (info.Length() != 4) {
    Napi::Error::New(info.Env(), "moveRelative be called passing moveRelative(dX, dY, dW, dH)").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }
  for (int i = 0; i < 4; i++) {
    if (!info[i].IsNumber()) {
      Napi::Error::New(info.Env(), "Parameter at position of " + std::to_string(i) + " must be a number.").ThrowAsJavaScriptException();
      return info.Env().Undefined();
    }
  }

  RECT dim;
  GetWindowRect(this->_identifier, &dim);

  const size_t dx = info[0].ToNumber().Int32Value();
  const size_t dy = info[1].ToNumber().Int32Value();
  const size_t dw = info[2].ToNumber().Int32Value();
  const size_t dh = info[3].ToNumber().Int32Value();

  const size_t x = dim.left + dx;
  const size_t y = dim.top + dy;
  const size_t w = (dim.right - dim.left) + dw;
  const size_t h = (dim.bottom - dim.top) + dh;

  bool returned = MoveWindow(this->_identifier, x, y, w, h, true);

  return Napi::Boolean::New(info.Env(), returned);
}

Napi::Value Window::GetHwnd(const Napi::CallbackInfo &info) {
  return Napi::Number::New(info.Env(), HandleToLong(this->_identifier));
}

Napi::Value Window::GetDimensions(const Napi::CallbackInfo& info) {
  RECT dim;
  GetWindowRect(this->_identifier, &dim);

  Napi::Object result = Napi::Object::New(info.Env());
  result.Set("left", Napi::Number::New(info.Env(), dim.left));
  result.Set("top", Napi::Number::New(info.Env(), dim.top));
  result.Set("right", Napi::Number::New(info.Env(), dim.right));
  result.Set("bottom", Napi::Number::New(info.Env(), dim.bottom));

  return result;
}

Napi::Value Window::IsVisible(const Napi::CallbackInfo& info) {
  bool returned = IsWindowVisible(this->_identifier);
  return Napi::Boolean::New(info.Env(), returned);
}

Napi::Value Window::Exists(const Napi::CallbackInfo& info) {
  bool returned = IsWindow(this->_identifier);
  return Napi::Boolean::New(info.Env(), returned);
}

Napi::Value Window::GetTitle(const Napi::CallbackInfo& info) {
  int lengthWindowText = GetWindowTextLength(this->_identifier);
  std::wstring title(lengthWindowText, L'\0');
  GetWindowTextW(this->_identifier, &title[0], lengthWindowText + 1);

  return Napi::String::New(info.Env(), std::u16string(title.begin(), title.end()));
}

Napi::Value Window::GetClassName(const Napi::CallbackInfo& info) {
  char wndTitle[256];
  ::GetClassName(this->_identifier, wndTitle, sizeof(wndTitle));

  return Napi::String::New(info.Env(), wndTitle);
}

Napi::Value Window::GetPid(const Napi::CallbackInfo& info) {
  DWORD lpdwProcessId;
  GetWindowThreadProcessId(this->_identifier, &lpdwProcessId);

  return Napi::Number::New(info.Env(), lpdwProcessId);
}

Napi::Value Window::GetProcessInfo(const Napi::CallbackInfo& info) {
  DWORD lpdwProcessId;
  TCHAR processPath[MAX_PATH];

  GetWindowThreadProcessId(this->_identifier, &lpdwProcessId);

  Napi::Object result = Napi::Object::New(info.Env());

  // Para solicitar datos de este proceso necesitamos crear un puntero a el
  HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, lpdwProcessId);

  int lengthWindowText = GetWindowTextLength(this->_identifier);
  std::wstring title(lengthWindowText, L'\0');
  GetWindowTextW(this->_identifier, &title[0], lengthWindowText + 1);

  result.Set("windowText", Napi::String::New(info.Env(),
        std::u16string(title.begin(), title.end())));

  // Comprobamos que tenemos acceso para consultar el proceso, y que el puntero esta bien
  if (NULL != hProcess) {
    HMODULE hMod;
    DWORD cbNeeded;

    // Set PID of the process
    result.Set("pid", Napi::Number::New(info.Env(), lpdwProcessId));

    // Check if process is still accesible
    if (EnumProcessModules(hProcess, &hMod, sizeof(hMod), &cbNeeded)) {
      GetModuleFileNameEx(hProcess, NULL, processPath, MAX_PATH);
      result.Set("path", Napi::String::New(info.Env(), processPath));
    } else {
      // If process is running as x32 but host is x64 GetModuleFileNameEx doesn't work
      DWORD dW = MAX_PATH;
      QueryFullProcessImageName(hProcess, NULL, processPath, &dW);
      result.Set("path", Napi::String::New(info.Env(), processPath));
    }
  }
  CloseHandle(hProcess);

  return result;

}

Napi::Value Window::GetParent(const Napi::CallbackInfo& info) {
  HWND parentHwnd = ::GetParent(this->_identifier);

  if (parentHwnd == NULL) {
    return info.Env().Undefined();
  } else {
    return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(parentHwnd)) });
  }
}

Napi::Value Window::GetAncestor(const Napi::CallbackInfo& info) {
  if (info.Length() != 1 || !info[0].IsNumber()) {
    Napi::Error::New(info.Env(), "The ancestor to be retrieved must be specified.").ThrowAsJavaScriptException();
    return info.Env().Undefined();
  }

  HWND ancestorHwnd = ::GetAncestor(this->_identifier, info[0].ToNumber().Int32Value());

  if (ancestorHwnd == NULL) {
    return info.Env().Undefined();
  } else {
    return constructor.New({ Napi::Number::New(info.Env(), HandleToLong(ancestorHwnd)) });
  }
}

Napi::Value Window::Close(const Napi::CallbackInfo& info) {
  bool returned = CloseWindow(this->_identifier);

  return Napi::Boolean::New(info.Env(), returned);
}
