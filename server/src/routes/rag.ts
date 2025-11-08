import { Router } from 'express';
import { z } from 'zod';
import { FileVectorStore } from '../vectorStore/fileStore';
import { getEmbedding } from '../services/genai';

const querySchema = z.object({
  documentId: z.string(),
  query: z.string().min(2),
  topK: z.number().optional().default(5),
});

export const createRagRouter = (vectorStore: FileVectorStore) => {
  const router = Router();

  router.post('/rag/query', async (req, res) => {
    const parsed = querySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { documentId, query, topK } = parsed.data;
    const doc = vectorStore.getDocument(documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document not indexed yet.' });
    }

    try {
      const queryEmbedding = await getEmbedding(query);
      const results = vectorStore.query(documentId, queryEmbedding, topK);
      res.json({ results });
    } catch (error) {
      console.error('RAG query failed', error);
      res.status(500).json({ error: 'RAG query failed.' });
    }
  });

  return router;
};
