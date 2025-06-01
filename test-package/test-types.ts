import { WhisperTranscriber, WhisperConfig } from 'whisper-web-transcriber';

// Test that types are available
const config: WhisperConfig = {
  modelSize: 'base.en',
  onTranscription: (text: string) => console.log(text)
};

// This should type-check correctly
const transcriber = new WhisperTranscriber(config);
console.log('✅ TypeScript types work correctly');