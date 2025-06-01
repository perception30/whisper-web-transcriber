// Test CommonJS import
try {
  const { WhisperTranscriber } = require('whisper-web-transcriber');
  console.log('✅ CommonJS import successful');
  console.log('WhisperTranscriber:', typeof WhisperTranscriber);
} catch (error) {
  console.error('❌ CommonJS import failed:', error.message);
}