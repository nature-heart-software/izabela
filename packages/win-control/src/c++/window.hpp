#include <windows.h>
#include <napi.h>

#ifndef _WINAUTOMATION_WINDOW
#define _WINAUTOMATION_WINDOW

class Window : public Napi::ObjectWrap<Window> {
public:
  Window(const Napi::CallbackInfo &info);

  static Napi::Value GetForeground(const Napi::CallbackInfo &info);
  static Napi::Value GetByClassName(const Napi::CallbackInfo &info);
  static Napi::Value GetByTitle(const Napi::CallbackInfo &info);
  static Napi::Value GetByPid(const Napi::CallbackInfo &info);
  static Napi::Object Init(Napi::Env env, Napi::Object exports);

  static BOOL CALLBACK Window::EnumWindowsCallback(HWND, LPARAM);

  Napi::Value SetForeground(const Napi::CallbackInfo &info);
  Napi::Value SetPosition(const Napi::CallbackInfo& info);
  Napi::Value SetShowStatus(const Napi::CallbackInfo& info);
  Napi::Value MoveRelative(const Napi::CallbackInfo& info);
  Napi::Value GetHwnd(const Napi::CallbackInfo &info);
  Napi::Value GetDimensions(const Napi::CallbackInfo& info);
  Napi::Value IsVisible(const Napi::CallbackInfo& info);
  Napi::Value Exists(const Napi::CallbackInfo& info);
  Napi::Value GetTitle(const Napi::CallbackInfo& info);
  Napi::Value GetClassName(const Napi::CallbackInfo& info);
  Napi::Value GetPid(const Napi::CallbackInfo& info);
  Napi::Value GetProcessInfo(const Napi::CallbackInfo& info);
  Napi::Value GetAncestor(const Napi::CallbackInfo& info);
  Napi::Value GetParent(const Napi::CallbackInfo& info);
  Napi::Value Close(const Napi::CallbackInfo& info);

private:
  HWND _identifier;
  bool _forceForeground();
  static Napi::FunctionReference constructor;
};

struct PidHwnd {
  unsigned long pid;
  HWND hwnd;
};
#endif
