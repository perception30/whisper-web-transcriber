// For easier setup, we'll use the bundled version through a script tag
// This avoids path resolution issues with the standard npm package
const WhisperTranscriber = window.WhisperTranscriber?.WhisperTranscriber;

// DOM Elements
const loadBtn = document.getElementById('loadBtn');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const clearBtn = document.getElementById('clearBtn');
const modelSelect = document.getElementById('modelSelect');
const statusText = document.getElementById('statusText');
const statusIndicator = document.getElementById('statusIndicator');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');
const transcriptionDiv = document.getElementById('transcription');
const errorMessage = document.getElementById('errorMessage');
const infoBox = document.getElementById('infoBox');
const audioLevel = document.getElementById('audioLevel');
const audioLevelBar = document.getElementById('audioLevelBar');

let transcriber = null;

// Initialize UI
function updateStatus(status, indicatorClass = '') {
    statusText.textContent = status;
    statusIndicator.className = 'status-indicator';
    if (indicatorClass) {
        statusIndicator.classList.add(indicatorClass);
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('visible');
    setTimeout(() => {
        errorMessage.classList.remove('visible');
    }, 5000);
}

function showProgress(show = true) {
    if (show) {
        progressBar.classList.add('visible');
    } else {
        progressBar.classList.remove('visible');
    }
}

// Check Cross-Origin Isolation
function checkCrossOriginIsolation() {
    if (window.crossOriginIsolated) {
        updateStatus('Ready', 'ready');
        infoBox.innerHTML = '✅ Cross-Origin Isolation is enabled. Ready to use!';
    } else {
        updateStatus('Warning: Limited functionality', 'loading');
        infoBox.innerHTML = '⚠️ Cross-Origin Isolation is not enabled. The demo is configured with proper headers, but you may need to refresh if this is your first visit.';
        console.log('To enable full functionality, ensure your server sends these headers:');
        console.log('Cross-Origin-Embedder-Policy: require-corp');
        console.log('Cross-Origin-Opener-Policy: same-origin');
    }
}

// Initialize transcriber
function initializeTranscriber() {
    const modelSize = modelSelect.value;
    
    transcriber = new WhisperTranscriber({
        modelSize: modelSize,
        onTranscription: (text) => {
            console.log('Transcription received:', text);
            
            // Clear the hint text if it's still there
            if (transcriptionDiv.innerHTML.includes('Speak clearly')) {
                transcriptionDiv.innerHTML = '';
            }
            
            // Append new transcription
            transcriptionDiv.textContent += text + ' ';
            
            // Auto-scroll to bottom
            transcriptionDiv.scrollTop = transcriptionDiv.scrollHeight;
        },
        onProgress: (progress) => {
            progressFill.style.width = progress + '%';
            updateStatus(`Loading model... ${progress}%`, 'loading');
        },
        onStatus: (status) => {
            updateStatus(status, status.includes('Recording') ? 'recording' : '');
        },
        debug: true
    });
}

// Event Handlers
loadBtn.addEventListener('click', async () => {
    try {
        loadBtn.disabled = true;
        showProgress(true);
        
        // Initialize transcriber if not already done
        if (!transcriber) {
            initializeTranscriber();
        }
        
        await transcriber.loadModel();
        
        showProgress(false);
        updateStatus('Model loaded', 'ready');
        startBtn.disabled = false;
        modelSelect.disabled = true;
        
    } catch (error) {
        console.error('Error loading model:', error);
        showError(`Failed to load model: ${error.message}`);
        loadBtn.disabled = false;
        showProgress(false);
        updateStatus('Error', '');
    }
});

startBtn.addEventListener('click', async () => {
    try {
        startBtn.disabled = true;
        transcriptionDiv.textContent = '';
        
        await transcriber.startRecording();
        
        stopBtn.disabled = false;
        updateStatus('Recording...', 'recording');
        audioLevel.style.display = 'block';
        
        // Add tip about speaking clearly
        if (!transcriptionDiv.textContent) {
            transcriptionDiv.innerHTML = '<em style="color: #a0aec0;">Speak clearly and at normal volume. The model processes audio every 5 seconds...</em>';
        }
        
    } catch (error) {
        console.error('Error starting recording:', error);
        showError(`Failed to start recording: ${error.message}`);
        startBtn.disabled = false;
        updateStatus('Error', '');
    }
});

stopBtn.addEventListener('click', () => {
    transcriber.stopRecording();
    
    startBtn.disabled = false;
    stopBtn.disabled = true;
    updateStatus('Stopped', 'ready');
    audioLevel.style.display = 'none';
});

clearBtn.addEventListener('click', () => {
    transcriptionDiv.textContent = '';
});

modelSelect.addEventListener('change', () => {
    // Reset transcriber when model changes
    if (transcriber) {
        transcriber.destroy();
        transcriber = null;
        startBtn.disabled = true;
        stopBtn.disabled = true;
        loadBtn.disabled = false;
        updateStatus('Model changed, please reload', '');
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Check if WhisperTranscriber is available
    if (!WhisperTranscriber) {
        showError('WhisperTranscriber not loaded. Please ensure the library is included.');
        loadBtn.disabled = true;
        return;
    }
    
    checkCrossOriginIsolation();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (transcriber) {
        transcriber.destroy();
    }
});