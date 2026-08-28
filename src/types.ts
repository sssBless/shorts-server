export interface Timeframe {
  start: number;
  end: number;
  title?: string;
}

export interface SubtitleStyles {
  textColor: string;
  fontName: string;
  fontSize: number;
  marginVertical: number;
  outlineColor: string;
  highlightColor: string;
  hasBackground?: boolean;
  backgroundColor?: string;
}

export interface WordTimestamp {
  word: string;
  start: number;
  end: number;
}

export interface SubtitleWord extends WordTimestamp {
  id: number;
}

export interface Transcription {
  text: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  words: WordTimestamp[];
}

export interface AnalysisFragment {
  videoPath: string;
  words: SubtitleWord[];
  rawAssText: string;
}

export interface ApproveBatchPayload {
  batchId: string;
  items: Array<{
    videoPath: string;
    words: SubtitleWord[];
  }>;
}