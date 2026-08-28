import type {SubtitleStyles, SubtitleWord, Transcription} from '../types.js';

export class SubtitleService {
  public toEditableWords(transcription: Transcription): SubtitleWord[] {
    return transcription.words.map((word, id) => ({...word, id}));
  }

  public toAss(transcription: Transcription, styles: SubtitleStyles): string {
    const words = transcription.words.length
      ? transcription.words
      : transcription.segments.flatMap(segment => [
          {word: segment.text, start: segment.start, end: segment.end},
        ]);

    const events = words
      .filter(word => word.word.trim() && word.end > word.start)
      .map((word, index) => {
        const next = words[index + 1];

        const fadeOutDuration = 0.25;
        const fadeInDuration = 0.15;

        const wordEnd = word.end + fadeOutDuration;

        const end = next
          ? Math.min(wordEnd, Math.max(word.end, next.start - 0.02))
          : wordEnd;

        if (end <= word.start) {
          return null;
        }

        return [
          'Dialogue: 0',
          this.assTime(word.start),
          this.assTime(end),
          'Default',
          '',
          '0',
          '0',
          '0',
          '',
          `{\\fad(${Math.round(fadeInDuration * 1000)},${Math.round(fadeOutDuration * 1000)})}${this.escape(word.word)}`,
        ].join(',');
      })
      .filter((event): event is string => event !== '');

    return this.header(styles) + events.join('\n');
  }

  private header(styles: SubtitleStyles): string {
    const hasBg = styles.hasBackground && styles.backgroundColor;
    const backColour = hasBg
      ? this.assColorWithAlpha(styles.backgroundColor!)
      : '&H00FFFFFF';
    const borderStyle = hasBg ? 3 : 1;

    return `[Script Info]
ScriptType: v4.00+
ScaledBorderAndShadow: yes
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,${styles.fontName},${styles.fontSize},${this.assColor(styles.textColor)},${this.assColor(styles.highlightColor)},${this.assColor(styles.outlineColor)},${backColour},1,0,0,0,100,100,1,0,${borderStyle},4,2,5,70,70,${styles.marginVertical},1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  }

  private assColorWithAlpha(hex: string): string {
    const value = hex.replace('#', '');
    if (!/^[0-9a-fA-F]{6,8}$/i.test(value)) return '&H80000000';

    let r: string, g: string, b: string, a: string;
    if (value.length === 8) {
      r = value.slice(4, 6);
      g = value.slice(2, 4);
      b = value.slice(0, 2);
      a = value.slice(6, 8);
    } else {
      r = value.slice(4, 6);
      g = value.slice(2, 4);
      b = value.slice(0, 2);
      a = '80'; // 50% alpha by default
    }

    // Convert alpha (00-FF) to ASS alpha (00-99, where 00=transparent, 99=opaque)
    const alphaValue = Math.round((1 - parseInt(a, 16) / 255) * 153)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();

    return `&H${alphaValue}${b}${g}${r}`;
  }

  private assTime(seconds: number): string {
    const safe = Math.max(0, seconds);
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const wholeSeconds = Math.floor(safe % 60);
    const centiseconds = Math.floor((safe % 1) * 100);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${wholeSeconds
      .toString()
      .padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
  }

  private assColor(hex: string): string {
    const value = hex.replace('#', '');
    if (!/^[0-9a-f]{6}$/i.test(value)) return '&H00FFFFFF';
    return `&H00${value.slice(4, 6)}${value.slice(2, 4)}${value.slice(0, 2)}`;
  }

  private escape(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\r?\n/g, '\\N');
  }
}
