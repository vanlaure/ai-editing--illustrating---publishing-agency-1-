import 'dotenv/config';

export type EmbeddingProvider = 'gemini' | 'ollama';

export interface EmbeddingConfig {
  provider: EmbeddingProvider;
  gemini?: {
    apiKey: string;
    model: string;
  };
  ollama?: {
    baseUrl: string;
    model: string;
  };
}

interface OllamaEmbedResponse {
  embedding: number[];
}

interface GeminiEmbedResponse {
  embeddings?: Array<{ values: number[] }>;
}

class EmbeddingService {
  private config: EmbeddingConfig;

  constructor() {
    const provider = (process.env.EMBEDDING_PROVIDER || 'gemini') as EmbeddingProvider;
    
    this.config = {
      provider,
      gemini: {
        apiKey: process.env.GEMINI_API_KEY || '',
        model: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004'
      },
      ollama: {
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text'
      }
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.provider === 'gemini') {
      if (!this.config.gemini?.apiKey) {
        console.warn('⚠️  GEMINI_API_KEY is not set. Embedding generation will fail.');
      }
    } else if (this.config.provider === 'ollama') {
      if (!this.config.ollama?.baseUrl) {
        console.warn('⚠️  OLLAMA_BASE_URL is not set. Using default: http://localhost:11434');
      }
      console.log(`ℹ️  Using Ollama at ${this.config.ollama?.baseUrl} with model ${this.config.ollama?.model}`);
    }
  }

  async getEmbedding(text: string): Promise<number[]> {
    switch (this.config.provider) {
      case 'gemini':
        return this.getGeminiEmbedding(text);
      case 'ollama':
        return this.getOllamaEmbedding(text);
      default:
        throw new Error(`Unknown embedding provider: ${this.config.provider}`);
    }
  }

  private async getGeminiEmbedding(text: string): Promise<number[]> {
    if (!this.config.gemini?.apiKey) {
      throw new Error('GEMINI_API_KEY is required for Gemini embeddings');
    }

    const { GoogleGenAI } = await import('@google/genai');
    const genAI = new GoogleGenAI({ apiKey: this.config.gemini.apiKey });

    const response = await genAI.models.embedContent({
      model: this.config.gemini.model,
      contents: text
    }) as GeminiEmbedResponse;

    const embedding = response.embeddings?.[0]?.values;
    if (!embedding) {
      throw new Error('No embedding returned from Gemini API');
    }

    return embedding;
  }

  private async getOllamaEmbedding(text: string): Promise<number[]> {
    if (!this.config.ollama?.baseUrl) {
      throw new Error('OLLAMA_BASE_URL is required for Ollama embeddings');
    }

    const url = `${this.config.ollama.baseUrl}/api/embeddings`;
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.config.ollama.model,
          prompt: text
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error (${response.status}): ${errorText}`);
      }

      const data = await response.json() as OllamaEmbedResponse;
      
      if (!data.embedding || !Array.isArray(data.embedding)) {
        throw new Error('Invalid embedding response from Ollama API');
      }

      return data.embedding;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to get Ollama embedding: ${error.message}`);
      }
      throw error;
    }
  }

  getProviderInfo(): { provider: EmbeddingProvider; model: string; ready: boolean } {
    const provider = this.config.provider;
    let model = '';
    let ready = false;

    if (provider === 'gemini') {
      model = this.config.gemini?.model || '';
      ready = !!this.config.gemini?.apiKey;
    } else if (provider === 'ollama') {
      model = this.config.ollama?.model || '';
      ready = !!this.config.ollama?.baseUrl;
    }

    return { provider, model, ready };
  }
}

export const embeddingService = new EmbeddingService();
export const getEmbedding = (text: string) => embeddingService.getEmbedding(text);