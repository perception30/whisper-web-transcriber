class WhisperTranscriber {
    constructor(config = {}) {
        this.instance = null;
        this.mediaRecorder = null;
        this.audioContext = null;
        this.isRecording = false;
        this.audio = null;
        this.audio0 = null;
        this.Module = null;
        this.modelLoaded = false;
        this.initPromise = null;
        this.config = {
            modelUrl: config.modelUrl || WhisperTranscriber.MODEL_URLS[config.modelSize || 'base-en-q5_1'],
            modelSize: config.modelSize || 'base-en-q5_1',
            sampleRate: config.sampleRate || 16000,
            audioIntervalMs: config.audioIntervalMs || 5000,
            onTranscription: config.onTranscription || (() => { }),
            onProgress: config.onProgress || (() => { }),
            onStatus: config.onStatus || (() => { }),
            debug: config.debug || false,
        };
    }
    log(message) {
        if (this.config.debug) {
            console.log('[WhisperTranscriber]', message);
        }
    }
    getScriptBasePath() {
        // Check if we're running from node_modules
        const scriptTags = document.getElementsByTagName('script');
        for (let i = 0; i < scriptTags.length; i++) {
            const src = scriptTags[i].src;
            if (src.includes('whisper-web-transcriber')) {
                const basePath = src.substring(0, src.lastIndexOf('/') + 1);
                return basePath;
            }
        }
        // Try to detect if we're in development mode
        if (window.location.hostname === 'localhost') {
            if (window.location.pathname.includes('/demo/')) {
                return '../dist/';
            }
            // Check if loaded from node_modules
            return '/node_modules/whisper-web-transcriber/dist/';
        }
        // Default to unpkg CDN for production
        return 'https://unpkg.com/whisper-web-transcriber/dist/';
    }
    async createWorkerFromURL(url) {
        // Fetch the worker script
        const response = await fetch(url);
        const workerCode = await response.text();
        // Create a blob URL for the worker
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        return new Worker(blobUrl);
    }
    async loadWasmModule() {
        const basePath = this.getScriptBasePath();
        const isCDN = basePath.includes('unpkg.com');
        // If loading from CDN, pre-fetch the worker and create blob URL
        if (isCDN) {
            const workerUrl = basePath + 'libstream.worker.js';
            try {
                // Pre-fetch and convert worker to blob URL
                const response = await fetch(workerUrl);
                const workerCode = await response.text();
                const blob = new Blob([workerCode], { type: 'application/javascript' });
                const blobUrl = URL.createObjectURL(blob);
                // Store the blob URL for later use
                window.__whisperWorkerBlobUrl = blobUrl;
            }
            catch (error) {
                this.log('Failed to pre-fetch worker: ' + error);
            }
        }
        // Load the WASM module dynamically
        const script = document.createElement('script');
        script.src = this.getScriptBasePath() + 'libstream.js';
        return new Promise((resolve, reject) => {
            // Configure Module before the script loads
            window.Module = {
                locateFile: (path) => {
                    // If it's the worker and we have a blob URL, use it
                    if (path === 'libstream.worker.js' && window.__whisperWorkerBlobUrl) {
                        return window.__whisperWorkerBlobUrl;
                    }
                    return this.getScriptBasePath() + path;
                },
                onRuntimeInitialized: () => {
                    this.log('WASM runtime initialized');
                    // The runtime is initialized, we can resolve immediately
                    // The Module will set up the whisper functions
                    setTimeout(() => {
                        const module = window.Module;
                        if (module) {
                            this.Module = module;
                            // Set up the whisper functions if they don't exist
                            if (!module.init) {
                                module.init = module.cwrap('init', 'number', ['string']);
                            }
                            if (!module.set_audio) {
                                module.set_audio = module.cwrap('set_audio', '', ['number', 'array']);
                            }
                            if (!module.get_transcribed) {
                                module.get_transcribed = module.cwrap('get_transcribed', 'string', []);
                            }
                            if (!module.set_status) {
                                module.set_status = module.cwrap('set_status', '', ['string']);
                            }
                            this.log('WASM module loaded and functions initialized');
                            resolve();
                        }
                        else {
                            reject(new Error('Module not available after runtime initialized'));
                        }
                    }, 100);
                }
            };
            script.onerror = () => reject(new Error('Failed to load WASM module'));
            document.head.appendChild(script);
        });
    }
    async loadHelpers() {
        // Load helpers.js
        const script = document.createElement('script');
        script.src = this.getScriptBasePath() + 'helpers.js';
        return new Promise((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load helpers'));
            document.head.appendChild(script);
        });
    }
    async initialize() {
        if (this.initPromise) {
            return this.initPromise;
        }
        this.initPromise = (async () => {
            try {
                // Set up global variables required by helpers.js
                window.dbVersion = 1;
                window.dbName = 'whisper.transcriber.models';
                // Don't override indexedDB, it's already a global property
                // Load helpers first
                await this.loadHelpers();
                this.log('Helpers loaded');
                // Then load WASM module
                await this.loadWasmModule();
                this.log('WASM module initialized');
                this.config.onStatus('Ready to load model');
            }
            catch (error) {
                this.log('Failed to initialize: ' + error);
                throw error;
            }
        })();
        return this.initPromise;
    }
    async loadModel() {
        if (this.modelLoaded) {
            this.log('Model already loaded');
            return;
        }
        await this.initialize();
        return new Promise((resolve, reject) => {
            const url = this.config.modelUrl;
            const size_mb = WhisperTranscriber.MODEL_SIZES[this.config.modelSize];
            this.config.onStatus('Loading model...');
            const storeFS = (fname, buf) => {
                try {
                    this.Module.FS_unlink(fname);
                }
                catch (e) {
                    // File doesn't exist, ignore
                }
                this.Module.FS_createDataFile("/", fname, buf, true, true);
                this.log(`Model stored: ${fname}, size: ${buf.length}`);
                this.modelLoaded = true;
                this.config.onStatus('Model loaded successfully');
                resolve();
            };
            const cbProgress = (progress) => {
                this.config.onProgress(Math.round(progress * 100));
            };
            const cbCancel = () => {
                this.config.onStatus('Model loading cancelled');
                reject(new Error('Model loading cancelled'));
            };
            const cbPrint = (msg) => {
                this.log(msg);
            };
            // Use the global loadRemote function from helpers.js
            window.loadRemote(url, 'whisper.bin', size_mb, cbProgress, storeFS, cbCancel, cbPrint);
        });
    }
    async startRecording() {
        if (!this.modelLoaded) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }
        if (this.isRecording) {
            this.log('Already recording');
            return;
        }
        // Initialize whisper instance
        if (!this.instance) {
            // Check if init function exists, otherwise use cwrap
            const init = this.Module.init || this.Module.cwrap('init', 'number', ['string']);
            this.instance = init('whisper.bin');
            if (!this.instance) {
                throw new Error('Failed to initialize Whisper');
            }
            this.log('Whisper instance initialized');
        }
        // Create audio context
        this.audioContext = new AudioContext({
            sampleRate: this.config.sampleRate,
            // @ts-ignore - These properties might not be in the type definition
            channelCount: 1,
            echoCancellation: false,
            autoGainControl: true,
            noiseSuppression: true,
        });
        const set_status = this.Module.set_status || this.Module.cwrap('set_status', '', ['string']);
        set_status("");
        this.isRecording = true;
        this.config.onStatus('Recording...');
        const chunks = [];
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            this.mediaRecorder = new MediaRecorder(stream);
            this.mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
                const blob = new Blob(chunks, { type: 'audio/ogg; codecs=opus' });
                const reader = new FileReader();
                reader.onload = (event) => {
                    const buf = new Uint8Array(event.target.result);
                    if (!this.audioContext)
                        return;
                    this.audioContext.decodeAudioData(buf.buffer, (audioBuffer) => {
                        const offlineContext = new OfflineAudioContext(audioBuffer.numberOfChannels, audioBuffer.length, audioBuffer.sampleRate);
                        const source = offlineContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(offlineContext.destination);
                        source.start(0);
                        offlineContext.startRendering().then((renderedBuffer) => {
                            this.audio = renderedBuffer.getChannelData(0);
                            const audioAll = new Float32Array(this.audio0 == null ? this.audio.length : this.audio0.length + this.audio.length);
                            if (this.audio0 != null) {
                                audioAll.set(this.audio0, 0);
                            }
                            audioAll.set(this.audio, this.audio0 == null ? 0 : this.audio0.length);
                            if (this.instance) {
                                const set_audio = this.Module.set_audio || this.Module.cwrap('set_audio', '', ['number', 'array']);
                                set_audio(this.instance, audioAll);
                            }
                        });
                    });
                };
                reader.readAsArrayBuffer(blob);
            };
            this.mediaRecorder.onstop = () => {
                if (this.isRecording) {
                    setTimeout(() => this.startRecording(), 0);
                }
            };
            this.mediaRecorder.start(this.config.audioIntervalMs);
            // Start transcription polling
            this.startTranscriptionPolling();
        }
        catch (error) {
            this.isRecording = false;
            this.config.onStatus('Error: ' + error.message);
            throw error;
        }
    }
    startTranscriptionPolling() {
        const interval = setInterval(() => {
            if (!this.isRecording) {
                clearInterval(interval);
                return;
            }
            const get_transcribed = this.Module.get_transcribed || this.Module.cwrap('get_transcribed', 'string', []);
            const transcribed = get_transcribed();
            if (transcribed != null && transcribed.length > 1) {
                this.config.onTranscription(transcribed);
            }
        }, 100);
    }
    stopRecording() {
        if (!this.isRecording) {
            this.log('Not recording');
            return;
        }
        const set_status = this.Module.set_status || this.Module.cwrap('set_status', '', ['string']);
        set_status("paused");
        this.isRecording = false;
        this.audio0 = null;
        this.audio = null;
        if (this.mediaRecorder) {
            this.mediaRecorder.stop();
            this.mediaRecorder = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.config.onStatus('Stopped');
    }
    destroy() {
        this.stopRecording();
        this.instance = null;
        this.Module = null;
        this.modelLoaded = false;
    }
}
WhisperTranscriber.MODEL_URLS = {
    'tiny.en': 'https://whisper.ggerganov.com/ggml-model-whisper-tiny.en.bin',
    'base.en': 'https://whisper.ggerganov.com/ggml-model-whisper-base.en.bin',
    'tiny-en-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-tiny.en-q5_1.bin',
    'base-en-q5_1': 'https://whisper.ggerganov.com/ggml-model-whisper-base.en-q5_1.bin',
};
WhisperTranscriber.MODEL_SIZES = {
    'tiny.en': 75,
    'base.en': 142,
    'tiny-en-q5_1': 31,
    'base-en-q5_1': 57,
};

export { WhisperTranscriber };
