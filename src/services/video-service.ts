import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'node:path';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export class VideoService {
  public async split(source: string, start: number, end: number, output: string): Promise<void> {
    await this.run(
      ffmpeg(source)
        .setStartTime(start)
        .setDuration(Math.max(0.1, end - start))
        .videoFilters('hflip')
        .videoCodec('libx264')
        .audioCodec('aac')
        .outputOptions(['-preset superfast', '-reset_timestamps 1'])
        .output(output),
    );
  }

  public async extractSpeechAudio(video: string, output: string): Promise<void> {
    await this.run(
      ffmpeg(video)
        .noVideo()
        .audioCodec('pcm_s16le')
        .format('wav')
        .audioChannels(1)
        .audioFrequency(16000)
        .audioFilters([
          'highpass=f=60',
          'lowpass=f=7500',
          'acompressor=threshold=-30dB:ratio=3:attack=20:release=250',
          'loudnorm=I=-16:TP=-1.5:LRA=11',
        ])
        .outputOptions(['-map 0:a:0', '-ar 16000', '-ac 1'])
        .output(output),
    );
  }

  public async burn(video: string, ass: string, output: string): Promise<void> {
    const subtitlePath = path.resolve(ass)
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:')
      .replace(/'/g, "\\'");

    await this.run(
      ffmpeg(video)
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoFilters([
          'scale=1080:1920:force_original_aspect_ratio=increase',
          'crop=1080:1920',
          `subtitles='${subtitlePath}'`,
        ])
        .outputOptions([
          '-preset medium',
          '-crf 20',
          '-pix_fmt yuv420p',
          '-movflags +faststart',
          '-r 30',
          '-y',
        ])
        .output(output),
    );
  }

  private run(command: ffmpeg.FfmpegCommand): Promise<void> {
    return new Promise((resolve, reject) => {
      command
        .on('error', error => reject(new Error(`FFmpeg error: ${error.message}`)))
        .on('end', () => resolve())
        .run();
    });
  }
}