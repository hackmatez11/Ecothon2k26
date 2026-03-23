import { HfInference } from '@huggingface/inference';
import { logger } from '../utils/logger';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY || process.env.HUGGING_FACE_TOKEN);

export class EmbeddingService {
  /**
   * all-MiniLM-L6-v2 uses 384 dimensions.
   * NOTE: You must recreate your Pinecone index with 384 dimensions!
   */
  private static readonly OUTPUT_DIMENSIONS = 384;
  private static readonly MODEL = process.env.HF_EMBEDDING_MODEL || 'sentence-transformers/all-MiniLM-L6-v2';

  /**
   * Generate embeddings for text using Hugging Face Inference API
   */
  static async generateEmbedding(text: string): Promise<number[]> {
    try {
      const result = await hf.featureExtraction({
        model: this.MODEL,
        inputs: text,
      });

      // result is number[] or number[][] depending on inputs
      const embedding = Array.isArray(result[0]) ? (result as number[][])[0] : (result as number[]);
      return embedding;
    } catch (error) {
      logger.error('Failed to generate embedding with Hugging Face:', error);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   */
  static async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const results = await hf.featureExtraction({
        model: this.MODEL,
        inputs: texts,
      });

      // results is number[][]
      return results as number[][];
    } catch (error) {
      logger.error('Failed to generate embeddings with Hugging Face:', error);
      throw error;
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  static cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error(`Vectors must have the same length (A: ${vecA.length}, B: ${vecB.length})`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}
