/// <reference types="svelte" />
/// <reference types="vite/client" />

declare module 'chroma-js' {
  import chroma from '@types/chroma-js';

  interface Input {
    autodetect: {
      p: number;
      test: (...args) => string | undefined;
    }[];
    format: Record<string, (val: any) => number[]>;
  }

  declare var input: Input;

  export default chroma;
  export { input };
}

type ColorMode =
  | 'cmyk'
  | 'css'
  | 'hcg'
  | 'hcl'
  | 'hex'
  | 'hsi'
  | 'hsl'
  | 'hsv'
  | 'lab'
  | 'lch'
  | 'named'
  | 'num'
  | 'oklab'
  | 'oklch'
  | 'rgb';

type ColorItem = {
  initialColor: chroma.Color;
  initialValue: string;
  color: chroma.Color;
  mode: ColorMode;
  rule: string;
  property: string;
  declaration: css.Declaration;
  group: ModificationGroup | null;
};

type ColorSection = { name: string | null; colorItems: ColorItem[] };

type ColorRule = { name: string; sections: ColorSection[] };

type ModificationGroup = {
  name: string;
  colorItems: ColorItem[];
  adjustHue: boolean;
  hueAdjustment: number;
  adjustSaturation: boolean;
  saturationAdjustment: number;
  adjustLightness: boolean;
  lightnessAdjustment: number;
};
