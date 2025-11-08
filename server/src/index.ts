import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { createDocumentsRouter } from './routes/documents';
import { createRagRouter } from './routes/rag';
import { createAiRouter } from './routes/ai';
import { FileVectorStore } from './vectorStore/fileStore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../data/vector-store.json');
const vectorStore = new FileVectorStore(dataPath);

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', createDocumentsRouter(vectorStore));
app.use('/api', createRagRouter(vectorStore));
app.use('/api', createAiRouter());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
