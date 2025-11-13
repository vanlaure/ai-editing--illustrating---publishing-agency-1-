/**
 * RAG Helper Utility
 * 
 * Provides semantic search across reference documents for editing agents.
 * Supports multi-document queries, relevance filtering, and citation formatting.
 */

import { FileVectorStore } from '../vectorStore/fileStore';
import { getEmbedding } from '../services/embeddingService';
import path from 'path';

const VECTOR_STORE_PATH = path.join(__dirname, '../../data/vectors/references.json');
const DEFAULT_TOP_K = 5;
const DEFAULT_THRESHOLD = 0.7;

export interface ReferenceResult {
  documentId: string;
  chunkId: string;
  heading: string;
  summary: string;
  content: string;
  ruleNumber?: string;
  category?: string;
  score: number;
  citation: string;
}

export interface QueryOptions {
  topK?: number;
  threshold?: number;
  includeContent?: boolean;
}

/**
 * Query reference documents for relevant rules and guidelines
 * 
 * @param query - Natural language search query
 * @param documentIds - Array of document IDs to search (e.g., ['chicago-manual-grammar', 'genre-romance'])
 * @param options - Query options (topK, threshold, includeContent)
 * @returns Array of reference results sorted by relevance
 */
export async function queryReferences(
  query: string,
  documentIds: string[],
  options: QueryOptions = {}
): Promise<ReferenceResult[]> {
  const {
    topK = DEFAULT_TOP_K,
    threshold = DEFAULT_THRESHOLD,
    includeContent = true
  } = options;

  // Initialize vector store
  const vectorStore = new FileVectorStore(VECTOR_STORE_PATH);
  
  // Generate query embedding
  const queryEmbedding = await getEmbedding(query);
  
  // Query each document
  const allResults: ReferenceResult[] = [];
  
  for (const documentId of documentIds) {
    const results = vectorStore.query(documentId, queryEmbedding, topK);
    
    // Transform and filter results
    const transformedResults = results
      .filter(r => r.score >= threshold)
      .map(r => {
        // Extract metadata if available
        const metadata = (r as any).metadata || {};
        
        return {
          documentId,
          chunkId: r.id,
          heading: r.heading,
          summary: r.summary,
          content: includeContent ? r.content : '',
          ruleNumber: metadata.ruleNumber,
          category: metadata.category,
          score: r.score,
          citation: formatCitation(documentId, r.heading, metadata.ruleNumber)
        };
      });
    
    allResults.push(...transformedResults);
  }
  
  // Sort by score descending and limit to topK across all documents
  return allResults
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

/**
 * Format citation for reference in agent responses
 * 
 * Examples:
 * - "[chicago-6.16: Serial Comma Usage]"
 * - "[Chicago Manual: Subject-Verb Agreement]"
 * - "[Romance: HEA Requirements]"
 */
function formatCitation(documentId: string, heading: string, ruleNumber?: string): string {
  if (ruleNumber) {
    return `[${ruleNumber}: ${heading}]`;
  }
  
  // Extract readable source name from documentId
  let sourceName = documentId
    .replace('chicago-manual-', 'Chicago Manual: ')
    .replace('genre-', '');
  
  // Capitalize genre names
  if (!sourceName.includes('Chicago Manual')) {
    sourceName = sourceName
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  return `[${sourceName}: ${heading}]`;
}

/**
 * Format multiple citations as a comma-separated string
 * 
 * @param results - Array of reference results
 * @returns Formatted citation string (e.g., "[chicago-6.16: Serial Comma], [romance-hea: HEA Requirements]")
 */
export function formatCitations(results: ReferenceResult[]): string {
  return results.map(r => r.citation).join(', ');
}

/**
 * Generate a formatted context string from reference results for agent prompts
 * 
 * @param results - Array of reference results
 * @returns Multi-line formatted context with citations, summaries, and relevance scores
 */
export function formatReferenceContext(results: ReferenceResult[]): string {
  if (results.length === 0) {
    return 'No relevant reference material found.';
  }
  
  return results
    .map((r, i) => {
      const parts = [
        `${i + 1}. ${r.citation}`,
        `   Summary: ${r.summary}`
      ];
      
      if (r.content) {
        parts.push(`   Detail: ${r.content}`);
      }
      
      parts.push(`   Relevance: ${(r.score * 100).toFixed(1)}%`);
      
      return parts.join('\n');
    })
    .join('\n\n');
}

/**
 * Query Chicago Manual rules (grammar + punctuation combined)
 * 
 * @param query - Natural language search query
 * @param options - Query options
 * @returns Array of reference results from Chicago Manual documents
 */
export async function queryChicagoManual(
  query: string,
  options?: QueryOptions
): Promise<ReferenceResult[]> {
  return queryReferences(
    query,
    ['chicago-manual-grammar', 'chicago-manual-punctuation'],
    options
  );
}

/**
 * Query genre-specific rules
 * 
 * @param genre - Genre name (romance, thriller, scifi, fantasy, mystery, literary)
 * @param query - Natural language search query
 * @param options - Query options
 * @returns Array of reference results from genre document
 */
export async function queryGenreRules(
  genre: string,
  query: string,
  options?: QueryOptions
): Promise<ReferenceResult[]> {
  const genreDocId = `genre-${genre.toLowerCase()}`;
  return queryReferences(query, [genreDocId], options);
}

/**
 * Query all available references (Chicago Manual + all genres)
 * 
 * @param query - Natural language search query
 * @param options - Query options
 * @returns Array of reference results from all documents
 */
export async function queryAllReferences(
  query: string,
  options?: QueryOptions
): Promise<ReferenceResult[]> {
  const documentIds = [
    'chicago-manual-grammar',
    'chicago-manual-punctuation',
    'genre-romance',
    'genre-thriller',
    'genre-scifi',
    'genre-fantasy',
    'genre-mystery',
    'genre-literary'
  ];
  
  return queryReferences(query, documentIds, options);
}

/**
 * Get available document IDs for reference queries
 * 
 * @returns Array of all available document IDs
 */
export function getAvailableDocuments(): string[] {
  return [
    'chicago-manual-grammar',
    'chicago-manual-punctuation',
    'genre-romance',
    'genre-thriller',
    'genre-scifi',
    'genre-fantasy',
    'genre-mystery',
    'genre-literary'
  ];
}

/**
 * Validate genre name and return corresponding document ID
 * 
 * @param genre - Genre name to validate
 * @returns Document ID if valid, null otherwise
 */
export function getGenreDocumentId(genre: string): string | null {
  const normalizedGenre = genre.toLowerCase();
  const validGenres = ['romance', 'thriller', 'scifi', 'fantasy', 'mystery', 'literary'];
  
  if (validGenres.includes(normalizedGenre)) {
    return `genre-${normalizedGenre}`;
  }
  
  return null;
}