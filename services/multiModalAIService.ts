import { generateImages, generateSpeech, generateVideo, generateVideoPrompt, getVideoOperationStatus, editImage } from './geminiService';
import { runAiCommand } from './geminiService';

export interface MultiModalInput {
  text?: string;
  image?: File | string; // File object or base64 string
  audio?: File | string; // File object or base64 string
  video?: File | string; // File object or base64 string
}

export interface MultiModalContext {
  documentId?: string;
  projectId?: string;
  userId?: string;
  currentSelection?: { from: number; to: number };
  documentContent?: string;
  cursor?: { from: number; to: number };
}

export interface AIProcessingResult {
  type: 'text' | 'image' | 'audio' | 'video' | 'analysis' | 'suggestion';
  content: any;
  confidence?: number;
  metadata?: Record<string, any>;
}

class MultiModalAIService {
  private processingQueue: Map<string, Promise<any>> = new Map();

  /**
   * Process multi-modal input and generate appropriate response
   */
  async processMultiModal(
    input: MultiModalInput,
    context: MultiModalContext,
    intent?: string
  ): Promise<AIProcessingResult[]> {
    const results: AIProcessingResult[] = [];
    const processingId = `process-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Analyze intent from multi-modal input
      const analyzedIntent = await this.analyzeIntent(input, context, intent);

      // Process based on intent and available modalities
      const processingPromises = [];

      // Text processing
      if (input.text || analyzedIntent.requiresText) {
        processingPromises.push(this.processTextModality(input, context, analyzedIntent));
      }

      // Image processing
      if (input.image || analyzedIntent.requiresImage) {
        processingPromises.push(this.processImageModality(input, context, analyzedIntent));
      }

      // Audio processing
      if (input.audio || analyzedIntent.requiresAudio) {
        processingPromises.push(this.processAudioModality(input, context, analyzedIntent));
      }

      // Video processing
      if (input.video || analyzedIntent.requiresVideo) {
        processingPromises.push(this.processVideoModality(input, context, analyzedIntent));
      }

      // Wait for all processing to complete
      const processingResults = await Promise.allSettled(processingPromises);

      // Collect successful results
      processingResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.warn(`Processing failed for modality ${index}:`, result.reason);
        }
      });

      // Generate integrated response if multiple modalities were processed
      if (results.length > 1) {
        const integratedResult = await this.integrateResults(results, analyzedIntent, context);
        if (integratedResult) {
          results.push(integratedResult);
        }
      }

      return results;
    } catch (error) {
      console.error('Multi-modal processing failed:', error);
      throw error;
    } finally {
      this.processingQueue.delete(processingId);
    }
  }

  private async analyzeIntent(
    input: MultiModalInput,
    context: MultiModalContext,
    explicitIntent?: string
  ): Promise<{
    intent: string;
    requiresText: boolean;
    requiresImage: boolean;
    requiresAudio: boolean;
    requiresVideo: boolean;
    confidence: number;
  }> {
    let intent = explicitIntent || 'general';

    // If no explicit intent, infer from available modalities
    if (!explicitIntent) {
      if (input.image && !input.text) {
        intent = 'image-analysis';
      } else if (input.audio && !input.text) {
        intent = 'audio-transcription';
      } else if (input.video && !input.text) {
        intent = 'video-analysis';
      } else if (input.text) {
        // Analyze text for intent
        const text = typeof input.text === 'string' ? input.text : '';
        if (text.toLowerCase().includes('show me') || text.toLowerCase().includes('visualize')) {
          intent = 'visualization';
        } else if (text.toLowerCase().includes('read') || text.toLowerCase().includes('speak')) {
          intent = 'text-to-speech';
        } else if (text.toLowerCase().includes('edit') || text.toLowerCase().includes('modify')) {
          intent = 'content-editing';
        }
      }
    }

    // Determine required modalities based on intent
    const requirements = {
      intent,
      requiresText: ['general', 'content-editing', 'analysis'].includes(intent),
      requiresImage: ['visualization', 'image-analysis', 'character-design'].includes(intent),
      requiresAudio: ['text-to-speech', 'audio-analysis'].includes(intent),
      requiresVideo: ['video-generation', 'video-analysis'].includes(intent),
      confidence: 0.8,
    };

    return requirements;
  }

  private async processTextModality(
    input: MultiModalInput,
    context: MultiModalContext,
    intent: any
  ): Promise<AIProcessingResult> {
    const text = typeof input.text === 'string' ? input.text : '';

    if (!text && context.documentContent) {
      // Use selected text from document
      const selection = context.currentSelection;
      if (selection && context.documentContent) {
        const selectedText = context.documentContent.substring(selection.from, selection.to);
        if (selectedText.trim()) {
          return {
            type: 'text',
            content: selectedText,
            metadata: { source: 'selection', intent: intent.intent }
          };
        }
      }
    }

    // Process text with AI
    const processedText = await runAiCommand(
      `Process this text in the context of creative writing: "${text}"`,
      context.documentContent || ''
    );

    return {
      type: 'text',
      content: processedText,
      metadata: { source: 'ai-processing', intent: intent.intent }
    };
  }

  private async processImageModality(
    input: MultiModalInput,
    context: MultiModalContext,
    intent: any
  ): Promise<AIProcessingResult> {
    let imageData: string;

    if (typeof input.image === 'string') {
      imageData = input.image;
    } else if (input.image instanceof File) {
      // Convert file to base64
      imageData = await this.fileToBase64(input.image);
    } else {
      throw new Error('Invalid image input');
    }

    // Generate or analyze based on intent
    if (intent.intent === 'visualization') {
      const prompt = `Create a visualization based on: ${input.text || 'the current document context'}`;
      const images = await generateImages(prompt, 1, '16:9');
      return {
        type: 'image',
        content: images[0],
        metadata: { prompt, intent: intent.intent }
      };
    } else {
      // Image analysis/editing
      const editedImage = await editImage(imageData, input.text || 'enhance this image for creative writing');
      return {
        type: 'image',
        content: editedImage,
        metadata: { original: imageData, intent: intent.intent }
      };
    }
  }

  private async processAudioModality(
    input: MultiModalInput,
    context: MultiModalContext,
    intent: any
  ): Promise<AIProcessingResult> {
    const textToSpeak = input.text || context.documentContent?.substring(
      context.currentSelection?.from || 0,
      context.currentSelection?.to || 1000
    ) || 'Hello world';

    const audioData = await generateSpeech(textToSpeak);

    return {
      type: 'audio',
      content: audioData,
      metadata: { text: textToSpeak, intent: intent.intent }
    };
  }

  private async processVideoModality(
    input: MultiModalInput,
    context: MultiModalContext,
    intent: any
  ): Promise<AIProcessingResult> {
    const prompt = input.text || 'Create a cinematic video based on the current document';
    const videoPrompt = await generateVideoPrompt(prompt);
    const videoOperation = await generateVideo(videoPrompt, '16:9');

    return {
      type: 'video',
      content: videoOperation,
      metadata: { prompt: videoPrompt, intent: intent.intent }
    };
  }

  private async integrateResults(
    results: AIProcessingResult[],
    intent: any,
    context: MultiModalContext
  ): Promise<AIProcessingResult | null> {
    // Create a comprehensive response that integrates all modalities
    const integrationPrompt = `
Based on the following multi-modal inputs and results, create an integrated creative response:

Available modalities: ${results.map(r => r.type).join(', ')}

Context: ${context.documentContent ? 'Writing document context available' : 'No document context'}

Primary intent: ${intent.intent}

Results summary:
${results.map((r, i) => `${i + 1}. ${r.type}: ${typeof r.content === 'string' ? r.content.substring(0, 100) + '...' : 'Binary data'}`).join('\n')}

Provide an integrated creative response that combines these inputs effectively.
    `;

    try {
      const integratedResponse = await runAiCommand(integrationPrompt, context.documentContent || '');

      return {
        type: 'analysis',
        content: integratedResponse,
        metadata: {
          integrated: true,
          modalities: results.map(r => r.type),
          intent: intent.intent
        }
      };
    } catch (error) {
      console.warn('Failed to integrate results:', error);
      return null;
    }
  }

  private async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix if present
        const base64 = result.split(',')[1] || result;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async getProcessingStatus(processingId: string): Promise<boolean> {
    return this.processingQueue.has(processingId);
  }
}

export const multiModalAIService = new MultiModalAIService();