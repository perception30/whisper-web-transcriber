# Real-time Audio Transcriber

A simple web application that transcribes audio in real-time using whisper.cpp compiled to WebAssembly.

## Features

- Real-time audio transcription from microphone
- Multiple Whisper model options (tiny, base, quantized versions)
- Clean, user-friendly interface
- Works entirely in the browser (no server required)

## Usage

1. Start a local web server:
   ```bash
   python3 -m http.server 8000
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:8000
   ```

3. Click "Load Model" to download and initialize the selected Whisper model

4. Once the model is loaded, click "Start Recording" to begin transcription

5. Speak into your microphone - the transcribed text will appear in real-time

## Requirements

- Modern web browser with WebAssembly support
- Microphone access permission
- Fast computer (transcription is CPU-intensive)

## Model Options

- **Tiny English (75 MB)**: Fastest, lower accuracy
- **Base English (142 MB)**: Better accuracy, slower
- **Tiny English Q5_1 (31 MB)**: Quantized tiny model, smaller size
- **Base English Q5_1 (57 MB)**: Quantized base model, good balance

## Technical Details

Built using:
- whisper.cpp (compiled to WebAssembly with Emscripten)
- Web Audio API for microphone access
- Service Worker for Cross-Origin Isolation (required for SharedArrayBuffer)

## Notes

- First-time model loading will take some time as models are downloaded
- Models are cached in browser storage after first download
- Transcription quality depends on microphone quality and background noise