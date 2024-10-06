# Custom Engine Api

## List Voices

### Method: `POST`

```
http://localhost:3000/list-voices
```

### Body: `application/json`

```json
{
  "credentials": {
    "apiKey": ""
  }
}
```

### Response: `application/json`

```json
[
  {
    "id": "Microsoft Hazel Desktop",
    "name": "Microsoft Hazel Desktop",
    "category": "Say",
    "languageCode": "en-US"
  },
  {
    "id": "Microsoft Zira Desktop",
    "name": "Microsoft Zira Desktop",
    "category": "Say",
    "languageCode": "en-US"
  }
]
```

⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃ ⁃

## Synthesize Speech

### Method: `POST`

```
http://localhost:3000/synthesize-speech
```

### Body: `application/json`

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

### Response: `audio/mp3`
