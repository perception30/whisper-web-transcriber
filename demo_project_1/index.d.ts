export interface WhisperConfig {
    modelUrl?: string;
    modelSize?: 'tiny.en' | 'base.en' | 'tiny-en-q5_1' | 'base-en-q5_1';
    sampleRate?: number;
    audioIntervalMs?: number;
    onTranscription?: (text: string) => void;
    onProgress?: (progress: number) => void;
    onStatus?: (status: string) => void;
    debug?: boolean;
}
export declare class WhisperTranscriber {
    private config;
    private instance;
    private mediaRecorder;
    private audioContext;
    private isRecording;
    private audio;
    private audio0;
    private Module;
    private modelLoaded;
    private initPromise;
    private static readonly MODEL_URLS;
    private static readonly MODEL_SIZES;
    constructor(config?: WhisperConfig);
    private log;
    private getScriptBasePath;
    private createWorkerFromURL;
    private loadWasmModule;
    private loadHelpers;
    initialize(): Promise<void>;
    loadModel(): Promise<void>;
    startRecording(): Promise<void>;
    private startTranscriptionPolling;
    stopRecording(): void;
    destroy(): void;
}
