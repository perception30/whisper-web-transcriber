(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.WhisperTranscriber = {}));
})(this, (function (exports) { 'use strict';

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
            // Try to detect if we're in development mode
            if (window.location.hostname === 'localhost' && window.location.pathname.includes('/demo/')) {
                return '../dist/';
            }
            // Default to unpkg CDN for production
            return 'https://unpkg.com/whisper-web-transcriber/dist/';
        }
        async loadWasmModule() {
            // Load the WASM module dynamically
            const script = document.createElement('script');
            script.src = this.getScriptBasePath() + 'libstream.js';
            return new Promise((resolve, reject) => {
                script.onload = () => {
                    // Wait for Module to be available
                    const checkModule = setInterval(() => {
                        if (typeof window.Module !== 'undefined') {
                            clearInterval(checkModule);
                            this.Module = window.Module;
                            this.log('WASM module loaded');
                            resolve();
                        }
                    }, 100);
                    // Timeout after 10 seconds
                    setTimeout(() => {
                        clearInterval(checkModule);
                        reject(new Error('Timeout loading WASM module'));
                    }, 10000);
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
                this.instance = this.Module.init('whisper.bin');
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
            this.Module.set_status("");
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
                                    this.Module.set_audio(this.instance, audioAll);
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
                const transcribed = this.Module.get_transcribed();
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
            this.Module.set_status("paused");
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

    exports.WhisperTranscriber = WhisperTranscriber;

}));
