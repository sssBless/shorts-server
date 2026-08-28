import type { SubtitleStyles } from '../types.js';

export interface StylePreset {
  key: string;
  name: string;
  styles: SubtitleStyles;
}

const presets: StylePreset[] = [
  {
    key: 'default',
    name: 'Default',
    styles: {
      textColor: '#FFFFFF',
      fontName: 'Arial',
      fontSize: 84,
      marginVertical: 220,
      outlineColor: '#101010',
      highlightColor: '#FFD700',
    },
  },
  {
    key: 'neon',
    name: 'Neon Glow',
    styles: {
      textColor: '#00FFCC',
      fontName: 'Arial',
      fontSize: 88,
      marginVertical: 200,
      outlineColor: '#FF00FF',
      highlightColor: '#00FFFF',
    },
  },
  {
    key: 'classic',
    name: 'Classic Cinema',
    styles: {
      textColor: '#FFFFFF',
      fontName: 'Arial',
      fontSize: 80,
      marginVertical: 240,
      outlineColor: '#000000',
      highlightColor: '#CCCCCC',
    },
  },
  {
    key: 'minimal',
    name: 'Minimal',
    styles: {
      textColor: '#FFFFFF',
      fontName: 'Arial',
      fontSize: 80,
      marginVertical: 220,
      outlineColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
    },
  },
  {
    key: 'bold',
    name: 'Bold & Dark',
    styles: {
      textColor: '#FFFFFF',
      fontName: 'Arial',
      fontSize: 90,
      marginVertical: 200,
      outlineColor: '#000000',
      highlightColor: '#FF4444',
    },
  },
  {
    key: 'fire',
    name: 'Fire',
    styles: {
      textColor: '#FFD700',
      fontName: 'Arial',
      fontSize: 86,
      marginVertical: 210,
      outlineColor: '#FF4500',
      highlightColor: '#FF0000',
    },
  },
  {
    key: 'box-dark',
    name: 'Dark Box',
    styles: {
      textColor: '#FFFFFF',
      fontName: 'Arial',
      fontSize: 84,
      marginVertical: 220,
      outlineColor: '#000000',
      highlightColor: '#FFFFFF',
      hasBackground: true,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
  },
  {
    key: 'box-white',
    name: 'White Box',
    styles: {
      textColor: '#111111',
      fontName: 'Arial',
      fontSize: 84,
      marginVertical: 220,
      outlineColor: '#FFFFFF',
      highlightColor: '#FFFFFF',
      hasBackground: true,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
    },
  },
  {
    key: 'box-lime',
    name: 'Lime Box',
    styles: {
      textColor: '#111111',
      fontName: 'Arial',
      fontSize: 84,
      marginVertical: 220,
      outlineColor: '#C6F36B',
      highlightColor: '#C6F36B',
      hasBackground: true,
      backgroundColor: 'rgba(198, 243, 107, 0.9)',
    },
  },
  {
    key: 'box-orange',
    name: 'Orange Box',
    styles: {
      textColor: '#111111',
      fontName: 'Arial',
      fontSize: 84,
      marginVertical: 220,
      outlineColor: '#FF9C64',
      highlightColor: '#FF9C64',
      hasBackground: true,
      backgroundColor: 'rgba(255, 156, 100, 0.9)',
    },
  },
];

export class StylePresetsService {
  static list(): StylePreset[] {
    return presets;
  }

  static getByKey(key: string): StylePreset | undefined {
    return presets.find((preset) => preset.key === key);
  }
}
