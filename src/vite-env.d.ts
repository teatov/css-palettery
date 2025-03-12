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
