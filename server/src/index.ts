import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { createDocumentsRouter } from './routes/documents';
import { createRagRouter } from './routes/rag';
import { createAiRouter } from './routes/ai';
import { createImageRouter } from './routes/images';
import { FileVectorStore } from './vectorStore/fileStore';
// import { createEditingRouter } from './agencies/editing';
// import { createIllustrationRouter } from './agencies/illustration';
// import { createPublishingRouter } from './agencies/publishing';
// import { createMarketingRouter } from './agencies/marketing';
import { createProjectsRouter } from './routes/projects';
import { editingRouter } from './routes/editing';
import { validateServerEnvironment, logServerEnvErrors, hasCriticalServerErrors } from './services/envValidation';
import { collaborationService } from './services/collaboration';
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.resolve(__dirname, '../data/vector-store.json');
const vectorStore = new FileVectorStore(dataPath);

// Validate environment on server startup
const envErrors = validateServerEnvironment();
logServerEnvErrors(envErrors);

if (hasCriticalServerErrors(envErrors)) {
  console.error('🚨 Critical server configuration errors. Server cannot start.');
  process.exit(1);
}

const app = express();

// Create HTTP server and Socket.IO server
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Initialize collaboration service
collaborationService.initialize(io);
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', createProjectsRouter());

// Legacy/general routes (kept for backward compatibility; new code should prefer agency routes)
app.use('/api', createDocumentsRouter(vectorStore));
app.use('/api', createRagRouter(vectorStore));
app.use('/api', createAiRouter());
app.use('/api', createImageRouter());

// Agency-bounded routes
app.use('/api/editing', editingRouter);
// TODO: Implement remaining agency routes when agency services are complete
// app.use('/api/illustration', createIllustrationRouter());
// app.use('/api/publishing', createPublishingRouter());
// app.use('/api/marketing', createMarketingRouter());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
