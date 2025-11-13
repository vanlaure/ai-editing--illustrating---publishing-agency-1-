/**
 * Reference Corpus Ingestion Script
 *
 * Ingests Chicago Manual and genre-specific reference documents into the FileVectorStore
 * for RAG-enabled editing agent retrieval.
 *
 * Usage: npm run ingest-references
 */

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { FileVectorStore } from '../vectorStore/fileStore';
import { getEmbedding } from '../services/embeddingService';
import type { VectorChunk } from '../types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ReferenceDocument {
  documentId: string;
  metadata: {
    title: string;
    description: string;
    version: string;
    category: string;
    genre?: string;
    lastUpdated: string;
  };
  chunks: Array<{
    id: string;
    heading: string;
    summary: string;
    content: string;
    ruleNumber: string;
    category: string;
    section: string;
    examples: Array<{
      label: string;
      code: string;
    }>;
  }>;
}

interface IngestionStats {
  documentsProcessed: number;
  chunksProcessed: number;
  errors: Array<{ file: string; error: string }>;
  startTime: number;
  endTime?: number;
}

const REFERENCES_DIR = path.join(__dirname, '../../data/references');
const VECTOR_STORE_PATH = path.join(__dirname, '../../data/vectors/references.json');

/**
 * Format chunk content for embedding - includes all searchable text
 */
function formatChunkForEmbedding(chunk: ReferenceDocument['chunks'][0]): string {
  const exampleTexts = chunk.examples
    .map(ex => `${ex.label}\n${ex.code}`)
    .join('\n\n');
  
  return `${chunk.heading}

${chunk.summary}

${chunk.content}

Examples:
${exampleTexts}`;
}

/**
 * Create metadata object for vector storage
 */
function createChunkMetadata(
  docId: string,
  chunk: ReferenceDocument['chunks'][0],
  docMetadata: ReferenceDocument['metadata']
) {
  return {
    documentId: docId,
    chunkId: chunk.id,
    heading: chunk.heading,
    ruleNumber: chunk.ruleNumber,
    category: chunk.category,
    section: chunk.section,
    genre: docMetadata.genre,
    title: docMetadata.title,
    summary: chunk.summary
  };
}

/**
 * Generate embeddings for an array of texts
 */
async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (let i = 0; i < texts.length; i++) {
    const embedding = await getEmbedding(texts[i]);
    embeddings.push(embedding);
    
    // Small delay to avoid rate limiting
    if (i < texts.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return embeddings;
}

/**
 * Ingest a single reference document
 */
async function ingestDocument(
  filePath: string,
  vectorStore: FileVectorStore,
  stats: IngestionStats
): Promise<void> {
  const fileName = path.basename(filePath);
  console.log(`\n📄 Processing: ${fileName}`);
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const doc: ReferenceDocument = JSON.parse(content);
    
    console.log(`   Document ID: ${doc.documentId}`);
    console.log(`   Title: ${doc.metadata.title}`);
    console.log(`   Chunks: ${doc.chunks.length}`);
    
    // Prepare chunks without embeddings
    const chunks: Omit<VectorChunk, 'embedding'>[] = doc.chunks.map(chunk => ({
      id: chunk.id,
      heading: chunk.heading,
      summary: chunk.summary,
      content: chunk.content,
      metadata: createChunkMetadata(doc.documentId, chunk, doc.metadata)
    }));
    
    // Prepare texts for embedding
    const embeddingTexts = doc.chunks.map(chunk => formatChunkForEmbedding(chunk));
    
    // Generate all embeddings
    console.log(`   Generating embeddings...`);
    const embeddings = await generateEmbeddings(embeddingTexts);
    
    // Upsert document with all chunks and embeddings
    console.log(`   Upserting to vector store...`);
    vectorStore.upsertDocument(
      doc.documentId,
      doc.metadata.title,
      chunks,
      embeddings
    );
    
    console.log(`   ✅ Completed: ${doc.chunks.length} chunks ingested`);
    
    stats.documentsProcessed++;
    stats.chunksProcessed += doc.chunks.length;
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`\n   ❌ Error processing document: ${errorMsg}`);
    stats.errors.push({
      file: fileName,
      error: errorMsg
    });
  }
}

/**
 * Main ingestion function
 */
async function ingestReferences(): Promise<void> {
  console.log('🚀 Starting reference corpus ingestion...\n');
  
  const stats: IngestionStats = {
    documentsProcessed: 0,
    chunksProcessed: 0,
    errors: [],
    startTime: Date.now()
  };
  
  try {
    // Ensure vector store directory exists
    const vectorStoreDir = path.dirname(VECTOR_STORE_PATH);
    if (!fs.existsSync(vectorStoreDir)) {
      fs.mkdirSync(vectorStoreDir, { recursive: true });
    }
    
    // Initialize vector store
    const vectorStore = new FileVectorStore(VECTOR_STORE_PATH);
    
    // Get all JSON files from references directory
    const files = fs.readdirSync(REFERENCES_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));
    
    if (jsonFiles.length === 0) {
      console.log('⚠️  No reference files found in', REFERENCES_DIR);
      return;
    }
    
    console.log(`📚 Found ${jsonFiles.length} reference documents:`);
    jsonFiles.forEach(f => console.log(`   - ${f}`));
    
    // Process each document
    for (const file of jsonFiles) {
      const filePath = path.join(REFERENCES_DIR, file);
      await ingestDocument(filePath, vectorStore, stats);
    }
    
    stats.endTime = Date.now();
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 INGESTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Documents processed: ${stats.documentsProcessed}/${jsonFiles.length}`);
    console.log(`Total chunks ingested: ${stats.chunksProcessed}`);
    console.log(`Duration: ${((stats.endTime - stats.startTime) / 1000).toFixed(2)}s`);
    console.log(`Average: ${(stats.chunksProcessed / ((stats.endTime - stats.startTime) / 1000)).toFixed(2)} chunks/sec`);
    
    if (stats.errors.length > 0) {
      console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
      stats.errors.forEach(({ file, error }) => {
        console.log(`   ${file}: ${error}`);
      });
    } else {
      console.log('\n✅ All documents ingested successfully!');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Test retrieval
    console.log('\n🔍 Testing vector retrieval...');
    const testQuery = 'comma usage in lists';
    console.log(`Query: "${testQuery}"`);
    
    const testEmbedding = await getEmbedding(testQuery);
    const results = vectorStore.query('chicago-manual-punctuation', testEmbedding, 3);
    
    console.log(`\nTop ${results.length} results:`);
    results.forEach((result, i) => {
      console.log(`\n${i + 1}. Score: ${result.score.toFixed(4)}`);
      console.log(`   Heading: ${result.heading}`);
      console.log(`   Summary: ${result.summary}`);
    });
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Fatal error during ingestion:', errorMsg);
    if (error instanceof Error && error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run ingestion if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestReferences()
    .then(() => {
      console.log('\n✅ Ingestion complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Ingestion failed:', error);
      process.exit(1);
    });
}

export { ingestReferences };
export type { IngestionStats };