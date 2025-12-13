#include <napi.h>

#include "window.hpp"

Napi::Object InitAll(Napi::Env env, Napi::Object exports) {
  exports = Window::Init(env, exports);
  return exports;
}

NODE_API_MODULE(NODE_GYP_MODULE_NAME, InitAll)
