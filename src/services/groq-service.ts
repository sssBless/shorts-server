import { readFile } from 'node:fs/promises';
import type { Transcription, WordTimestamp } from '../types.js';

interface GroqResponse {
  text?: string;
  segments?: Array<{ start?: number; end?: number; text?: string }>;
  words?: Array<{ word?: string; start?: number; end?: number }>;
}

const TRANSCRIPTION_PROMPT =
  'Транскрибируй только отчетливо слышимую речь. Не добавляй догадки и титры. Сохраняй язык каждого фрагмента и не переводи речь. Сохраняй порядок и смысл сказанного. Если речи не слышно, не создавай текст.';

export class GroqService {
  public constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly apiUrl: string,
  ) {}

  public async transcribe(audioPath: string): Promise<Transcription> {
    const audio = await readFile(audioPath);
    const form = new FormData();

    form.append('file', new Blob([audio], { type: 'audio/wav' }), 'audio.wav');
    form.append('model', this.model);
    form.append('response_format', 'verbose_json');
    form.append('temperature', '0');
    form.append('timestamp_granularities[]', 'segment');
    form.append('timestamp_granularities[]', 'word');
    form.append('prompt', TRANSCRIPTION_PROMPT.slice(0, 700));

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: form,
    });

    if (!response.ok) {
      throw new Error(
        `Groq API error (${response.status}): ${await response.text()}`,
      );
    }

    const raw = (await response.json()) as GroqResponse;
    return {
      text: raw.text ?? '',
      segments: (raw.segments ?? [])
        .filter(
          segment =>
            Number.isFinite(segment.start) &&
            Number.isFinite(segment.end) &&
            Boolean(segment.text?.trim()),
        )
        .map(segment => ({
          start: segment.start as number,
          end: segment.end as number,
          text: segment.text!.trim(),
        })),
      words: this.normalizeWords(raw.words ?? []),
    };
  }

  private normalizeWords(
    words: Array<{ word?: string; start?: number; end?: number }>,
  ): WordTimestamp[] {
    return words
      .filter(
        word =>
          Boolean(word.word?.trim()) &&
          Number.isFinite(word.start) &&
          Number.isFinite(word.end) &&
          (word.end as number) > (word.start as number),
      )
      .map(word => ({
        word: word.word!.trim(),
        start: Math.max(0, word.start as number),
        end: word.end as number,
      }))
      .sort((a, b) => a.start - b.start);
  }
}