{
  "targets": [
    {
      "target_name": "wincontrol",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
          "src/c++/window.cpp",
        "src/c++/main.cpp"
        ],
        'msvs_settings': {
          'VCCLCompilerTool': {
            'ObjectFile': "$(IntDir)/%(Directory)/"
          }
        },
        'include_dirs': [
          "<!@(node -p \"require('node-addon-api').include\")"
        ],
        'libraries': [],
        'dependencies': [
          "<!(node -p \"require('node-addon-api').gyp\")"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ]
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
      {
        "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
        "destination": "<(module_path)"
      }
      ]
    }
  ]
}
