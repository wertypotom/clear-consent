import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generates an embedding for a piece of text using OpenAI text-embedding-3-large.
 * This model has 3072 dimensions.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-large',
    input: text.replace(/\n/g, ' '), // Pre-processing to flatten the text
  });

  return response.data[0].embedding;
}

/**
 * Split text into overlapping chunks for better context preservation.
 */
export function chunkText(
  text: string,
  chunkSize: number = 800,
  overlap: number = 100,
): string[] {
  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    let endIndex = startIndex + chunkSize;
    
    // If this is not the first chunk, start before the previous end to create overlap
    const chunk = text.slice(startIndex, endIndex);
    chunks.push(chunk);

    // Update start index for the next chunk
    startIndex = endIndex - overlap;

    // Safety break for edge cases
    if (startIndex >= text.length - overlap) break;
  }

  return chunks;
}
