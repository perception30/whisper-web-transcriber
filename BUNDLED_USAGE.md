# Bundled Version Usage Guide

The bundled version of whisper-web-transcriber includes all necessary files (workers and helpers) inline, solving CORS issues for web workers when using CDNs.

## Available Builds

- `dist/index.bundled.js` - Full bundled version with all dependencies inline
- `dist/index.bundled.min.js` - Minified bundled version
- `dist/index.js` - Standard UMD build (requires external files)
- `dist/index.esm.js` - ES Module build
- `dist/index.min.js` - Minified standard build

## CDN Usage

### Step 1: Include the Script
```html
<script src="https://unpkg.com/whisper-web-transcriber/dist/index.bundled.min.js"></script>
```

### Step 2: Handle Cross-Origin Isolation
For SharedArrayBuffer support (required by Whisper), you need ONE of these options:

#### Option A: Configure Server Headers (Recommended)
Add these headers to your server:
```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

#### Option B: Use Service Worker
```html
<script>
  // Get the service worker code from the library
  const transcriber = new WhisperTranscriber.WhisperTranscriber();
  const swCode = transcriber.getServiceWorkerCode();
  
  // Save this as 'coi-serviceworker.js' on YOUR domain
  // Then register it:
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/coi-serviceworker.js');
  }
</script>
```

### Step 3: Use the Transcriber
```html
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

## What the Bundled Version Solves

1. **Web Worker CORS Issues**: Workers are created from blob URLs, avoiding cross-origin restrictions
2. **Single File Distribution**: All workers and helpers are embedded in one file
3. **No Manual File Copying**: Unlike the standard npm version, no need to copy files from node_modules
4. **CDN-Friendly**: Can be loaded directly from unpkg or other CDNs

## What Still Requires Setup

**Cross-Origin Isolation** for SharedArrayBuffer support still requires either:
- Server headers (COOP/COEP)
- A service worker on YOUR domain (cannot be auto-registered from CDN)

## How It Works

The bundled version:
1. Includes all worker scripts as inlined strings
2. Creates blob URLs for workers at runtime (this works across origins!)
3. Provides the service worker code via `getServiceWorkerCode()` method
4. Falls back to external files if inline versions are not available

## File Sizes

- Bundled: ~220KB (uncompressed)
- Bundled Min: ~95KB (minified)
- Note: This includes all workers and helpers

## Browser Support

Same as the standard version - requires modern browsers with WebAssembly support.