import Fastify from 'fastify';
import multipart from '@fastify/multipart';
import { access, mkdir, writeFile, rm, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { pipeline } from 'node:stream/promises';
import { createWriteStream } from 'node:fs';
import fastifyStatic from '@fastify/static'
import { config, assertConfig, defaultSubtitleStyles } from './config.js';
import { GroqService } from './services/groq-service.js';
import { SubtitleService } from './services/subtitle-service.js';
import { VideoService } from './services/video-service.js';
import { StylePresetsService } from './services/StylePresetsService.js';
import type { Timeframe, SubtitleStyles } from './types.js';

const app = Fastify({ logger: true });
const videoService = new VideoService();
const subtitleService = new SubtitleService();
const groqService = new GroqService(
  config.groqApiKey,
  config.groqModel,
  config.groqApiUrl,
);

await mkdir(config.uploadDir, { recursive: true });
await mkdir(config.publicVideoDir, { recursive: true });
app.register(multipart, { limits: { fileSize: 150 * 1024 * 1024 } });

app.register(fastifyStatic, {
  root: config.publicVideoDir,
  prefix: '/public/videos',
  serve: true
})

app.post('/api/v1/video/analyze', async (request, reply) => {
  const parts = request.parts();
  let videoPath = '';
  let timeframes: Timeframe[] = [];
  let styles: SubtitleStyles = { ...defaultSubtitleStyles };

  try {
    for await (const part of parts) {
      if (part.type === 'file' && part.fieldname === 'video') {
        videoPath = path.join(config.uploadDir, `source_${randomUUID()}.mp4`);
        await pipeline(part.file, createWriteStream(videoPath));
      }
      if (part.type === 'field' && part.fieldname === 'timeframes') {
        timeframes = JSON.parse(String(part.value)) as Timeframe[];
      }
      if (part.type === 'field' && part.fieldname === 'styles') {
        styles = { ...styles, ...(JSON.parse(String(part.value)) as Partial<SubtitleStyles>) };
      }
    }

    if (!videoPath || !timeframes.length) {
      return reply.code(400).send({ error: 'Video and timeframes are required' });
    }

    const batchId = randomUUID();
    const fragments = [];

    for (const [index, timeframe] of timeframes.entries()) {
      const fragment = path.join(config.uploadDir, `${batchId}_${index}.mp4`);
      const audio = path.join(config.uploadDir, `${batchId}_${index}.wav`);
      await videoService.split(videoPath, timeframe.start, timeframe.end, fragment);
      await videoService.extractSpeechAudio(fragment, audio);
      const transcription = await groqService.transcribe(audio);
      const words = subtitleService.toEditableWords(transcription);
      fragments.push({
        videoPath: fragment,
        words,
        rawAssText: subtitleService.toAss(transcription, styles),
      });
    }

    return reply.send({ success: true, batchId, fragments });
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: error instanceof Error ? error.message : 'Analysis failed' });
  }
});

app.post('/api/v1/video/approve', async (request, reply) => {
  const body = request.body as { batchId?: string; items?: Array<{ videoPath: string; words: Array<{ word: string; start: number; end: number; id: number }> }>; styles?: Partial<SubtitleStyles> };
  if (!body.batchId || !body.items?.length) {
    return reply.code(400).send({ error: 'batchId and items are required' });
  }

  try {
    const videos: string[] = [];
    for (const [index, item] of body.items.entries()) {
      const assPath = path.join(config.uploadDir, `${body.batchId}_${index}.ass`);
      const outputPath = path.join(config.publicVideoDir, `shorts_${body.batchId}_${index}.mp4`);
      const transcription = { text: '', segments: [], words: item.words };
      const usedStyles = { ...defaultSubtitleStyles, ...body.styles };
      await writeFile(assPath, subtitleService.toAss(transcription, usedStyles), 'utf8');
      await videoService.burn(item.videoPath, assPath, outputPath);
      const filename = path.basename(outputPath);
      videos.push(`http://localhost:${config.port}/public/videos/${filename}`);
    }

    // Очистка служебных файлов из uploads после успешного рендеринга
    const files = await readdir(config.uploadDir);
    for (const file of files) {
      await rm(path.join(config.uploadDir, file), { force: true });
    }

    return reply.send({ success: true, videos });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: error instanceof Error ? error.message : 'Rendering failed' });
  }
});

app.get('/api/v1/styles', async (_request, reply) => {
  return StylePresetsService.list();
});

assertConfig();
await app.listen({ port: config.port, host: '0.0.0.0' });