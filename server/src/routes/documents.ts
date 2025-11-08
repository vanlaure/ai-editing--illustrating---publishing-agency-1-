import { Router } from 'express';
import { z } from 'zod';
import { chunkManuscript } from '../utils/chunker';
import { FileVectorStore } from '../vectorStore/fileStore';
import { getEmbedding } from '../services/genai';

const ingestSchema = z.object({
  documentId: z.string().min(2),
  title: z.string().optional().default('Manuscript'),
  text: z.string().min(10),
  chunkSize: z.number().optional(),
});

export const createDocumentsRouter = (vectorStore: FileVectorStore) => {
  const router = Router();

  router.post('/documents', async (req, res) => {
    const parseResult = ingestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.flatten() });
    }

    const { documentId, title, text, chunkSize } = parseResult.data;
    const chunks = chunkManuscript(text, chunkSize);
    if (!chunks.length) {
      return res.status(400).json({ error: 'Unable to derive chunks from manuscript.' });
    }

    try {
      const embeddings = [] as number[][];
      for (const chunk of chunks) {
        const embedding = await getEmbedding(chunk.content);
        embeddings.push(embedding);
      }
      const stored = vectorStore.upsertDocument(documentId, title, chunks, embeddings);
      res.json({ documentId, segments: stored.map(({ embedding, ...rest }) => rest) });
    } catch (error) {
      console.error('Failed to index document', error);
      res.status(500).json({ error: 'Failed to index manuscript.' });
    }
  });

  return router;
};
