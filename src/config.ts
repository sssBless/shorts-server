import 'dotenv/config';
import path from 'node:path';

// dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 3000),
  uploadDir: path.join(process.cwd(), 'uploads'),
  publicVideoDir: path.join(process.cwd(), 'public', 'videos'),
  groqApiKey: process.env.GROQ_API_KEY ?? '',
  groqModel: process.env.GROQ_MODEL ?? 'whisper-large-v3-turbo',
  groqApiUrl:
    process.env.GROQ_API_URL ??
    'https://api.groq.com/openai/v1/audio/transcriptions',
};

export const defaultSubtitleStyles = {
  textColor: '#FFFFFF',
  fontName: 'Arial',
  fontSize: 84,
  marginVertical: 220,
  outlineColor: '#101010',
  highlightColor: '#FFD700',
};

export function assertConfig(): void {
  if (!config.groqApiKey) {
    throw new Error('GROQ_API_KEY is not configured');
  }
}