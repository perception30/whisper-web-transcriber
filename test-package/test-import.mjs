// Test ESM import
try {
  const { WhisperTranscriber } = await import('whisper-web-transcriber');
  console.log('✅ ESM import successful');
  console.log('WhisperTranscriber:', typeof WhisperTranscriber);
} catch (error) {
  console.error('❌ ESM import failed:', error.message);
}