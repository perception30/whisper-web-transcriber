# Whisper Web Transcriber

Real-time audio transcription in the browser using OpenAI's Whisper model via WebAssembly. This package provides an easy-to-use API for integrating speech-to-text capabilities into web applications without any server-side processing.

**[Live Demo](https://demoproject1-jz33savrh-perception30s-projects.vercel.app)** 🎙️

## Features

- 🎙️ Real-time audio transcription from microphone
- 🌐 Runs entirely in the browser (no server required)
- 📦 Multiple Whisper model options (tiny, base, quantized versions)
- 💾 Automatic model caching in IndexedDB
- 🔧 Simple, promise-based API
- 📱 Works on all modern browsers with WebAssembly support
- 🌍 Platform-independent (same WASM works on all OS)

## Installation

```bash
npm install whisper-web-transcriber
```

Or using yarn:

```bash
yarn add whisper-web-transcriber
```


## Quick Start

```javascript
import { WhisperTranscriber } from 'whisper-web-transcriber';

// Create a new transcriber instance
const transcriber = new WhisperTranscriber({
  modelSize: 'base-en-q5_1', // or 'tiny.en', 'base.en', 'tiny-en-q5_1'
  onTranscription: (text) => {
    console.log('Transcribed:', text);
    document.getElementById('transcription').textContent += text + ' ';
  },
  onProgress: (progress) => {
    console.log('Loading progress:', progress + '%');
  },
  onStatus: (status) => {
    console.log('Status:', status);
  }
});

// Load the model (only needed once, cached in browser)
await transcriber.loadModel();

// Start recording
await transcriber.startRecording();

// Stop recording
transcriber.stopRecording();
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

## Model Options

| Model | Size | Description |
|-------|------|-------------|
| `tiny.en` | 75 MB | Fastest, lower accuracy |
| `base.en` | 142 MB | Better accuracy, slower |
| `tiny-en-q5_1` | 31 MB | Quantized tiny model, smaller size |
| `base-en-q5_1` | 57 MB | Quantized base model, good balance |

## Browser Requirements

- WebAssembly support
- SharedArrayBuffer support (the library tries to enable this automatically)
- Microphone access permission
- Modern browser (Chrome 90+, Firefox 89+, Safari 15+, Edge 90+)

## CORS and Security Headers

The library automatically handles CORS issues for Web Workers when loading from CDNs. However, for best performance and SharedArrayBuffer support, you should serve your site with these headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

**Note:** The library includes a fallback mechanism that attempts to enable SharedArrayBuffer support even without these headers.

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

## Example HTML

**Important:** When using the npm package, you need to serve your HTML file through a local web server (not `file://`). You can use:
- `python3 -m http.server 8080`
- `npx serve`
- Any other local web server

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <title>Whisper Transcriber Demo</title>
  <!-- Important: Include this for SharedArrayBuffer support -->
  <script src="node_modules/whisper-web-transcriber/dist/coi-serviceworker.js"></script>
</head>
<body>
  <button id="load">Load Model</button>
  <button id="start" disabled>Start Recording</button>
  <button id="stop" disabled>Stop Recording</button>
  
  <div>
    <strong>Status:</strong>
    <div id="status">Ready to load model</div>
  </div>
  
  <div>
    <strong>Progress:</strong>
    <div id="progress">-</div>
  </div>
  
  <div>
    <strong>Transcription:</strong>
    <div id="transcription">Transcribed text will appear here...</div>
  </div>

  <script type="module">
    // Import from your local node_modules
    import { WhisperTranscriber } from './node_modules/whisper-web-transcriber/dist/index.esm.js';

    const transcriber = new WhisperTranscriber({
      modelSize: 'tiny-en-q5_1', // Smallest model for quick testing
      onTranscription: (text) => {
        const div = document.getElementById('transcription');
        if (div.textContent === 'Transcribed text will appear here...') {
          div.textContent = '';
        }
        div.textContent += text + ' ';
      },
      onProgress: (progress) => {
        document.getElementById('progress').textContent = progress + '%';
      },
      onStatus: (status) => {
        document.getElementById('status').textContent = status;
      },
      debug: true // Enable debug logs for troubleshooting
    });

    document.getElementById('load').onclick = async () => {
      try {
        document.getElementById('load').disabled = true;
        await transcriber.loadModel();
        document.getElementById('start').disabled = false;
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').textContent = 'Error: ' + error.message;
        document.getElementById('load').disabled = false;
      }
    };

    document.getElementById('start').onclick = async () => {
      try {
        document.getElementById('start').disabled = true;
        document.getElementById('transcription').textContent = 'Listening...';
        await transcriber.startRecording();
        document.getElementById('stop').disabled = false;
      } catch (error) {
        console.error('Error:', error);
        document.getElementById('status').textContent = 'Error: ' + error.message;
        document.getElementById('start').disabled = false;
      }
    };

    document.getElementById('stop').onclick = () => {
      transcriber.stopRecording();
      document.getElementById('start').disabled = false;
      document.getElementById('stop').disabled = true;
    };
  </script>
</body>
</html>
```


## Performance Considerations

- Transcription is CPU-intensive
- Larger models provide better accuracy but require more processing power
- Quantized models (Q5_1) offer good balance between size and quality
- First-time model loading may take time (models are cached afterward)

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