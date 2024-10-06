# Custom Engine Api

## List Voices

### Method: POST

```
http://localhost:3000/list-voices
```

### Body (**raw**)

```json
{
  "credentials": {
    "apiKey": ""
  }
}
```

⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃

## Synthesize Speech

### Method: POST

```
http://localhost:3000/synthesize-speech
```

### Body (**raw**)

```json
{
  "credentials": {
    "apiKey": ""
  },
  "payload": {
    "text": "Hello world, programmed to work and not to feel.",
    "voice": {
      "id": "Microsoft Hazel Desktop",
      "name": "Microsoft Hazel Desktop",
      "category": "Say",
      "languageCode": "en-US"
    }
  }
}
```
