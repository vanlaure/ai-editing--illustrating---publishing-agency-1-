import { GoogleGenAI } from '@google/genai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.warn('GEMINI_API_KEY is not set. Backend AI routes will fail until it is configured.');
}

export const genAI = new GoogleGenAI({ apiKey: apiKey || '' });

export const getEmbedding = async (text: string): Promise<number[]> => {
  if (!apiKey) throw new Error('API key missing.');
  const response = await genAI.models.embedContent({
    model: 'text-embedding-004',
    contents: text
  });
  const embedding = response.embeddings?.[0]?.values;
  if (!embedding) {
    throw new Error('No embedding returned from Gemini.');
  }
  return embedding;
};

export const generateContent = async (model: string, prompt: string) => {
  if (!apiKey) throw new Error('API key missing.');
  const response = await genAI.models.generateContent({
    model: model,
    contents: prompt
  });
  return response.text;
};
