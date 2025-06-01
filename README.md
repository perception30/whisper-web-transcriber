# Whisper Web Transcriber

Real-time audio transcription in the browser using OpenAI's Whisper model via WebAssembly. This package provides an easy-to-use API for integrating speech-to-text capabilities into web applications without any server-side processing.

**[Live Demo](https://perception30.github.io/whisper-web-transcriber/)** 🎙️

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
- SharedArrayBuffer support
- Microphone access permission
- Modern browser (Chrome 90+, Firefox 89+, Safari 15+, Edge 90+)

## CORS and Security Headers

For SharedArrayBuffer support, your site needs specific headers:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

If you're using the included demo server:

```bash
npm run demo
```

## Example HTML

```html
<!DOCTYPE html>
<html>
<head>
  <title>Whisper Transcriber Demo</title>
</head>
<body>
  <button id="load">Load Model</button>
  <button id="start" disabled>Start</button>
  <button id="stop" disabled>Stop</button>
  <div id="status"></div>
  <div id="progress"></div>
  <div id="transcription"></div>

  <script type="module">
    import { WhisperTranscriber } from 'whisper-web-transcriber';

    const transcriber = new WhisperTranscriber({
      onTranscription: (text) => {
        document.getElementById('transcription').textContent += text + ' ';
      },
      onProgress: (progress) => {
        document.getElementById('progress').textContent = progress + '%';
      },
      onStatus: (status) => {
        document.getElementById('status').textContent = status;
      }
    });

    document.getElementById('load').onclick = async () => {
      await transcriber.loadModel();
      document.getElementById('start').disabled = false;
    };

    document.getElementById('start').onclick = async () => {
      await transcriber.startRecording();
      document.getElementById('start').disabled = true;
      document.getElementById('stop').disabled = false;
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