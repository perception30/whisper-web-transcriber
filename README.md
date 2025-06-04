# Whisper Web Transcriber

Real-time audio transcription in the browser using OpenAI's Whisper model via WebAssembly. This package provides an easy-to-use API for integrating speech-to-text capabilities into web applications without any server-side processing.

**[Live Demo](https://demoproject1-jz33savrh-perception30s-projects.vercel.app)** 🎙️ | **[Live Usage on Real Site](https://interviewhacker.ai/)** 🚀

## Features

- 🎙️ Real-time audio transcription from microphone
- 🌐 Runs entirely in the browser (no server required)
- 📦 Multiple Whisper model options (tiny, base, quantized versions)
- 💾 Automatic model caching in IndexedDB
- 🔧 Simple, promise-based API
- 📱 Works on all modern browsers with WebAssembly support
- 🌍 Platform-independent (same WASM works on all OS)

## Installation

### NPM Package
```bash
npm install whisper-web-transcriber
```

Or using yarn:
```bash
yarn add whisper-web-transcriber
```

### CDN Usage (Bundled Version)
```html
<!-- Single file with all dependencies included -->
<script src="https://unpkg.com/whisper-web-transcriber/dist/index.bundled.min.js"></script>
```


## Quick Start

### Using NPM Package
```javascript
import { WhisperTranscriber } from 'whisper-web-transcriber';

const transcriber = new WhisperTranscriber({
  modelSize: 'base-en-q5_1',
  onTranscription: (text) => {
    console.log('Transcribed:', text);
  }
});

await transcriber.loadModel();
await transcriber.startRecording();
```

### Using CDN (Bundled Version)
```html
<script src="https://unpkg.com/whisper-web-transcriber/dist/index.bundled.min.js"></script>
<script>
  const transcriber = new WhisperTranscriber.WhisperTranscriber({
    modelSize: 'base-en-q5_1',
    onTranscription: (text) => {
      console.log('Transcribed:', text);
    }
  });

  transcriber.loadModel().then(() => {
    transcriber.startRecording();
  });
</script>
```

## API Reference

### Constructor Options

```typescript
interface WhisperConfig {
  modelUrl?: string;              // Custom model URL (optional)
  modelSize?: 'tiny.en' | 'base.en' | 'tiny-en-q5_1' | 'base-en-q5_1';
  sampleRate?: number;            // Audio sample rate (default: 16000)
  audioIntervalMs?: number;       // Audio processing interval (default: 5000ms)
  onTranscription?: (text: string) => void;
  onProgress?: (progress: number) => void;
  onStatus?: (status: string) => void;
  debug?: boolean;                // Enable debug logging (default: false)
}
```

### Methods

- `loadModel(): Promise<void>` - Downloads and initializes the Whisper model
- `startRecording(): Promise<void>` - Starts microphone recording and transcription
- `stopRecording(): void` - Stops recording
- `destroy(): void` - Cleanup resources
- `getServiceWorkerCode(): string | null` - Returns the COI service worker code (bundled version only)
- `getCrossOriginIsolationInstructions(): string` - Returns setup instructions for Cross-Origin Isolation

## Model Options

| Model | Size | Description |
|-------|------|-------------|
| `tiny.en` | 75 MB | Fastest, lower accuracy |
| `base.en` | 142 MB | Better accuracy, slower |
| `tiny-en-q5_1` | 31 MB | Quantized tiny model, smaller size |
| `base-en-q5_1` | 57 MB | Quantized base model, good balance |

## Browser Requirements

- WebAssembly support
- SharedArrayBuffer support (requires Cross-Origin Isolation)
- Microphone access permission
- Modern browser (Chrome 90+, Firefox 89+, Safari 15+, Edge 90+)

## Cross-Origin Isolation Setup

WhisperTranscriber requires SharedArrayBuffer, which needs Cross-Origin Isolation. You have two options:

### Option 1: Server Headers (Recommended)
Configure your server to send these headers:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

### Option 2: Service Worker
If you can't modify server headers, use the included service worker:

**For NPM users:**
```html
<!-- Include at the top of your HTML -->
<script src="node_modules/whisper-web-transcriber/dist/coi-serviceworker.js"></script>
```

**For CDN users:**
```javascript
// Get the service worker code
const transcriber = new WhisperTranscriber.WhisperTranscriber();
const swCode = transcriber.getServiceWorkerCode();

// Save swCode as 'coi-serviceworker.js' on YOUR domain
// Then include it in your HTML:
// <script src="/coi-serviceworker.js"></script>
```

**Important:** Service workers must be served from the same origin as your page. CDN users cannot directly use the service worker from unpkg.

### Serving with proper headers

**For local development:**
```bash
npm run demo
```

**For production (examples):**

Vercel (`vercel.json`):
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Cross-Origin-Embedder-Policy",
          "value": "require-corp"
        },
        {
          "key": "Cross-Origin-Opener-Policy", 
          "value": "same-origin"
        }
      ]
    }
  ]
}
```

Nginx:
```nginx
add_header Cross-Origin-Embedder-Policy "require-corp" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
```

## Complete Examples

### Example 1: Using NPM Package

```html
<!DOCTYPE html>
<html>
<head>
  <title>Whisper Transcriber - NPM Version</title>
  <!-- Include service worker for Cross-Origin Isolation -->
  <script src="node_modules/whisper-web-transcriber/dist/coi-serviceworker.js"></script>
</head>
<body>
  <button id="start">Start Recording</button>
  <button id="stop">Stop Recording</button>
  <div id="transcription"></div>

  <script type="module">
    import { WhisperTranscriber } from './node_modules/whisper-web-transcriber/dist/index.esm.js';

    const transcriber = new WhisperTranscriber({
      modelSize: 'tiny-en-q5_1',
      onTranscription: (text) => {
        document.getElementById('transcription').textContent += text + ' ';
      }
    });

    document.getElementById('start').onclick = async () => {
      await transcriber.loadModel();
      await transcriber.startRecording();
    };

    document.getElementById('stop').onclick = () => {
      transcriber.stopRecording();
    };
  </script>
</body>
</html>
```

### Example 2: Using CDN (Bundled Version)

```html
<!DOCTYPE html>
<html>
<head>
  <title>Whisper Transcriber - CDN Version</title>
  <!-- Note: You still need to handle Cross-Origin Isolation -->
  <!-- Either configure server headers OR save and include the service worker -->
</head>
<body>
  <button id="start">Start Recording</button>
  <button id="stop">Stop Recording</button>
  <div id="transcription"></div>

  <!-- Single script include -->
  <script src="https://unpkg.com/whisper-web-transcriber/dist/index.bundled.min.js"></script>
  <script>
    const transcriber = new WhisperTranscriber.WhisperTranscriber({
      modelSize: 'tiny-en-q5_1',
      onTranscription: (text) => {
        document.getElementById('transcription').textContent += text + ' ';
      }
    });

    // Check if Cross-Origin Isolation is enabled
    if (!window.crossOriginIsolated) {
      console.log(transcriber.getCrossOriginIsolationInstructions());
    }

    document.getElementById('start').onclick = async () => {
      await transcriber.loadModel();
      await transcriber.startRecording();
    };

    document.getElementById('stop').onclick = () => {
      transcriber.stopRecording();
    };
  </script>
</body>
</html>
```


## Bundled vs Standard Version

### Bundled Version (`index.bundled.js`)
- ✅ **Single file** - All workers and dependencies included
- ✅ **CDN-friendly** - No CORS issues with web workers
- ✅ **Zero configuration** - Works out of the box (except for Cross-Origin Isolation)
- ❌ **Larger initial download** - ~220KB uncompressed, ~95KB minified
- 📦 **Best for**: Quick prototypes, CDN usage, simple deployments

### Standard Version (`index.js`)
- ✅ **Smaller initial size** - Core library only
- ✅ **Modular loading** - Workers loaded on demand
- ❌ **Requires all files** - Must serve worker files from same origin
- ❌ **More complex setup** - Need to copy files from node_modules
- 📦 **Best for**: Production apps with bundlers, optimized loading

## Performance Considerations

- Transcription is CPU-intensive
- Larger models provide better accuracy but require more processing power
- Quantized models (Q5_1) offer good balance between size and quality
- First-time model loading may take time (models are cached afterward)

## Troubleshooting

### "SharedArrayBuffer is not defined"
You need to enable Cross-Origin Isolation. See the [Cross-Origin Isolation Setup](#cross-origin-isolation-setup) section.

### "Failed to load worker" when using CDN
Use the bundled version (`index.bundled.min.js`) instead of the standard version.

### "Microphone access denied"
Ensure your site is served over HTTPS (or localhost) and the user has granted microphone permissions.

### Service worker not working
- Service workers must be served from the same origin as your page
- Check browser console for specific error messages
- Ensure the service worker file is accessible at the correct path

## Technical Details

Built using:
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) compiled to WebAssembly
- Web Audio API for microphone access
- IndexedDB for model caching
- Service Worker for Cross-Origin Isolation

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- [whisper.cpp](https://github.com/ggerganov/whisper.cpp) by Georgi Gerganov
- [OpenAI Whisper](https://github.com/openai/whisper) for the original model