// Helper function to write a string to a DataView
function writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }
  
  // Function to create a WAV Blob from raw PCM data returned by the Gemini API
  export function createWavBlobFromBase64(base64Pcm: string): Blob {
    // 1. Decode base64 to Uint8Array
    const binaryString = atob(base64Pcm);
    const len = binaryString.length;
    const pcmData = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      pcmData[i] = binaryString.charCodeAt(i);
    }
  
    // 2. Define WAV parameters (based on Gemini TTS output)
    const numChannels = 1; // mono
    const sampleRate = 24000;
    const bitsPerSample = 16; // 2 bytes per sample (Int16)
    const dataSize = pcmData.length;
    const blockAlign = (numChannels * bitsPerSample) / 8;
    const byteRate = sampleRate * blockAlign;
  
    // 3. Create WAV header (44 bytes)
    const header = new ArrayBuffer(44);
    const view = new DataView(header);
    
    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true); // chunk size
    writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // subchunk 1 size (16 for PCM)
    view.setUint16(20, 1, true); // audio format (1 for PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
  
    // 4. Combine header and PCM data into a single Blob
    return new Blob([view, pcmData], { type: 'audio/wav' });
}