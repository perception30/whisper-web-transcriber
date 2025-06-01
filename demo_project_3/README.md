# Whisper Web Transcriber - Rollup Demo

This demo shows how to use `whisper-web-transcriber` with Rollup bundler for an easy, hassle-free setup.

## Features

- ✅ Automatic CORS header configuration
- ✅ Service worker included and configured
- ✅ Uses bundled version for zero-config setup
- ✅ Clean, modern UI
- ✅ Multiple model options
- ✅ Real-time transcription display
- ✅ No path resolution issues

## Setup

1. Install dependencies:
```bash
npm install
```

2. Run development server:
```bash
npm run dev
```

This will:
- Bundle the application
- Start a development server at http://localhost:3000
- Configure proper CORS headers automatically
- Enable live reload

## Production Build

To create a production build:
```bash
npm run build
```

Then serve the `dist` directory:
```bash
npm run serve
```

## How It Works

### 1. Rollup Configuration
The `rollup.config.js` handles:
- Bundling ES modules
- Copying static files (HTML, CSS)
- Copying all whisper-web-transcriber files including the bundled version
- Setting up development server with CORS headers

### 2. Cross-Origin Isolation
The development server automatically adds the required headers:
```javascript
headers: {
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin'
}
```

### 3. Bundled Version Usage
The demo uses the bundled version (`index.bundled.min.js`) which includes:
- All web workers inlined as base64 strings
- Helper functions embedded
- Service worker code embedded
- No external file dependencies

This eliminates all path resolution and CORS issues.

## Project Structure

```
demo_project_3/
├── src/
│   ├── index.html     # Main HTML file
│   ├── style.css      # Styles
│   └── main.js        # Application logic
├── dist/              # Build output (generated)
├── rollup.config.js   # Rollup configuration
├── package.json       # Dependencies and scripts
└── README.md         # This file
```

## Key Advantages

1. **Zero Configuration**: Just `npm install` and `npm run dev`
2. **Automatic Headers**: No manual server configuration needed
3. **Modern Tooling**: Uses Rollup for efficient bundling
4. **Developer Experience**: Live reload and source maps
5. **Production Ready**: Optimized builds with proper file structure

## Customization

### Changing Models
Edit the model options in `src/index.html`:
```html
<select id="modelSelect">
    <option value="tiny-en-q5_1">Tiny (31 MB)</option>
    <option value="base-en-q5_1">Base (57 MB)</option>
    <!-- Add more models here -->
</select>
```

### Styling
Modify `src/style.css` to customize the appearance.

### Server Configuration
Edit `rollup.config.js` to change server settings:
```javascript
serve({
    port: 3000,  // Change port
    host: '0.0.0.0',  // Change host
    // Add more options
})
```

## Troubleshooting

### "SharedArrayBuffer is not defined"
- Ensure you're accessing the site via the dev server, not file://
- Check that the CORS headers are being sent (visible in DevTools Network tab)

### "Failed to load worker"
- Make sure the service worker is being copied correctly
- Check the browser console for specific errors

### Microphone Access
- The site must be served over HTTPS or localhost
- Grant microphone permissions when prompted

### No Transcription Appearing
If the model is running but no text appears:
- **Speak clearly and at normal volume** - Whisper needs clear audio
- **Wait 5 seconds** - The model processes audio in 5-second chunks
- **Check your microphone** - Ensure it's not muted and working properly
- **Try different speech** - Numbers, common phrases, or reading text works well
- **Use a different model** - Tiny models may be less accurate than base models
- **Check console** - Look for "Transcription received:" messages

The logs show `whisper_full() returned 0` which means the model is processing audio successfully, but it may be detecting silence or unclear speech.

## Deployment

For production deployment:

1. Build the project: `npm run build`
2. Deploy the `dist` folder to your server
3. Ensure your server sends the required CORS headers:
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

### Example Nginx Configuration
```nginx
location / {
    add_header Cross-Origin-Embedder-Policy require-corp;
    add_header Cross-Origin-Opener-Policy same-origin;
    try_files $uri $uri/ /index.html;
}
```

## License

MIT