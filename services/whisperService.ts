

const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => {
      const base64data = reader.result?.toString().split(',')[1];
      if (base64data) resolve(base64data);
      else reject(new Error("Failed to convert blob to base64"));
    };
    reader.onerror = reject;
  });
};

export const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
  try {
    const base64Data = await blobToBase64(audioBlob);
    
    const fetchResponse = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            role: 'user',
            parts: [
              { text: 'Transcribe the following audio accurately. Output ONLY the transcription, with no additional commentary.' },
              {
                inlineData: {
                  mimeType: audioBlob.type || 'audio/webm',
                  data: base64Data
                }
              }
            ]
          }
        ]
      })
    });

    if (!fetchResponse.ok) {
      const errorData = await fetchResponse.json();
      throw new Error(errorData.error || fetchResponse.statusText);
    }

    const response = await fetchResponse.json();
    return response.text || '';
  } catch (error: any) {
    console.error('Transcription failed:', error);
    throw new Error(`Gemini Transcription error: ${error.message || 'Unknown error'}`);
  }
};
