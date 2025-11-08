import fs from 'fs';
import path from 'path';
import { VectorChunk, VectorDocument } from '../types';

interface StoredData {
  documents: Record<string, VectorDocument>;
}

export class FileVectorStore {
  private data: StoredData;
  private readonly filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.data = this.load();
  }

  private load(): StoredData {
    if (!fs.existsSync(this.filePath)) {
      return { documents: {} };
    }
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      return JSON.parse(raw) as StoredData;
    } catch (error) {
      console.warn('Failed to parse vector store file, reinitializing.', error);
      return { documents: {} };
    }
  }

  private persist() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

  upsertDocument(documentId: string, title: string, chunks: Omit<VectorChunk, 'embedding'>[], embeddings: number[][]) {
    if (chunks.length !== embeddings.length) {
      throw new Error('Chunk and embedding counts do not match.');
    }
    const storedChunks: VectorChunk[] = chunks.map((chunk, index) => ({
      ...chunk,
      embedding: embeddings[index],
    }));
    this.data.documents[documentId] = {
      documentId,
      title,
      chunks: storedChunks,
    };
    this.persist();
    return storedChunks;
  }

  getDocument(documentId: string) {
    return this.data.documents[documentId] ?? null;
  }

  query(documentId: string, queryEmbedding: number[], topK = 5) {
    const doc = this.getDocument(documentId);
    if (!doc) return [];
    const scored = doc.chunks.map((chunk) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, chunk.embedding),
    }));
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(({ chunk, score }) => ({
        id: chunk.id,
        heading: chunk.heading,
        summary: chunk.summary,
        content: chunk.content,
        score,
      }));
  }
}

const cosineSimilarity = (a: number[], b: number[]) => {
  const dot = a.reduce((sum, val, idx) => sum + val * (b[idx] || 0), 0);
  const normA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const normB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return normA && normB ? dot / (normA * normB) : 0;
};
