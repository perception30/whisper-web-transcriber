# Bundled Version Usage Guide

The bundled version of whisper-web-transcriber includes all necessary files (workers, helpers, and service worker) inline, making it perfect for CDN usage without CORS issues.

## Available Builds

- `dist/index.bundled.js` - Full bundled version with all dependencies inline
- `dist/index.bundled.min.js` - Minified bundled version
- `dist/index.js` - Standard UMD build (requires external files)
- `dist/index.esm.js` - ES Module build
- `dist/index.min.js` - Minified standard build

## CDN Usage (Recommended)

```html
<!-- No need to include any other files! -->
<script src="https://unpkg.com/whisper-web-transcriber/dist/index.bundled.min.js"></script>

<script>
  const transcriber = new WhisperTranscriber.WhisperTranscriber({
    modelSize: 'tiny-en-q5_1',
    onTranscription: (text) => {
      console.log('Transcribed:', text);
    },
    onStatus: (status) => {
      console.log('Status:', status);
    }
  });
  
  // The COI service worker will be auto-registered if needed
  transcriber.loadModel().then(() => {
    console.log('Model loaded!');
  });
</script>
```

## NPM Usage

For bundler environments (webpack, vite, etc.), use the standard ES module:

```javascript
import { WhisperTranscriber } from 'whisper-web-transcriber';

const transcriber = new WhisperTranscriber({
  modelSize: 'tiny-en-q5_1'
});
```

## Features of Bundled Version

1. **Single File**: Everything is contained in one JavaScript file
2. **Auto Service Worker**: COI service worker is automatically registered if needed
3. **No CORS Issues**: Workers are created from blob URLs
4. **Zero Configuration**: Just include and use

## How It Works

The bundled version:
1. Includes all worker scripts as inlined strings
2. Creates blob URLs for workers at runtime
3. Automatically registers the COI service worker if SharedArrayBuffer is not available
4. Falls back to external files if inline versions are not available

## File Sizes

- Bundled: ~220KB (uncompressed)
- Bundled Min: ~95KB (minified)
- Note: This includes all workers and helpers

## Browser Support

Same as the standard version - requires modern browsers with WebAssembly support.