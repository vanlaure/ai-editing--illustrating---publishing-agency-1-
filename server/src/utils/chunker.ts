import { v4 as uuidv4 } from 'uuid';

export interface Chunk {
  id: string;
  heading: string;
  summary: string;
  quote: string;
  content: string;
}

const WORDS_PER_CHUNK = 180;

const summarize = (text: string) => {
  const words = text.split(/\s+/).filter(Boolean);
  return words.slice(0, 30).join(' ') + (words.length > 30 ? '…' : '');
};

const headingFromText = (text: string) => {
  const trimmed = text.trim();
  if (!trimmed) return 'Untitled Segment';
  const firstSentence = trimmed.split(/(?<=[.!?])\s+/)[0];
  return firstSentence.slice(0, 80) + (firstSentence.length > 80 ? '…' : '');
};

export const chunkManuscript = (text: string, chunkSize = WORDS_PER_CHUNK): Chunk[] => {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const chunks: Chunk[] = [];
  let buffer: string[] = [];

  const flushBuffer = () => {
    if (!buffer.length) return;
    const content = buffer.join('\n\n');
    const firstParagraph = buffer[0] || content;
    chunks.push({
      id: uuidv4(),
      heading: headingFromText(content),
      summary: summarize(content),
      quote: firstParagraph.slice(0, 240) + (firstParagraph.length > 240 ? '…' : ''),
      content,
    });
    buffer = [];
  };

  let wordCounter = 0;
  for (const paragraph of paragraphs) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (wordCounter + words.length > chunkSize && buffer.length) {
      flushBuffer();
      wordCounter = 0;
    }
    buffer.push(paragraph);
    wordCounter += words.length;
  }
  flushBuffer();
  return chunks;
};
