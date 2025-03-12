import { input } from 'chroma-js';

const INT_OR_PCT = /((?:-?\d+)|(?:-?\d+(?:\.\d+)?)%|none)/.source;
const FLOAT_OR_PCT = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%?)|none)/.source;
const PCT = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)%)|none)/.source;
const RE_S = /\s*/.source;
const SEP = /\s+/.source;
const COMMA = /\s*,\s*/.source;
const ANLGE = /((?:-?(?:\d+(?:\.\d*)?|\.\d+)(?:deg)?)|none)/.source;
const ALPHA = /\s*(?:\/\s*((?:[01]|[01]?\.\d+)|\d+(?:\.\d+)?%))?/.source;

const RE_RGB = new RegExp(
  '^rgba?\\(' +
    RE_S +
    [INT_OR_PCT, INT_OR_PCT, INT_OR_PCT].join(SEP) +
    ALPHA +
    '\\)$'
);
const RE_RGB_LEGACY = new RegExp(
  '^rgb\\(' +
    RE_S +
    [INT_OR_PCT, INT_OR_PCT, INT_OR_PCT].join(COMMA) +
    RE_S +
    '\\)$'
);
const RE_RGBA_LEGACY = new RegExp(
  '^rgba\\(' +
    RE_S +
    [INT_OR_PCT, INT_OR_PCT, INT_OR_PCT, FLOAT_OR_PCT].join(COMMA) +
    RE_S +
    '\\)$'
);

const RE_HSL = new RegExp(
  '^hsla?\\(' + RE_S + [ANLGE, PCT, PCT].join(SEP) + ALPHA + '\\)$'
);
const RE_HSL_LEGACY = new RegExp(
  '^hsl?\\(' + RE_S + [ANLGE, PCT, PCT].join(COMMA) + RE_S + '\\)$'
);
const RE_HSLA_LEGACY =
  /^hsla\(\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)%\s*,\s*(-?\d+(?:\.\d+)?)%\s*,\s*([01]|[01]?\.\d+)\)$/;

const RE_LAB = new RegExp(
  '^lab\\(' +
    RE_S +
    [FLOAT_OR_PCT, FLOAT_OR_PCT, FLOAT_OR_PCT].join(SEP) +
    ALPHA +
    '\\)$'
);
const RE_LCH = new RegExp(
  '^lch\\(' +
    RE_S +
    [FLOAT_OR_PCT, FLOAT_OR_PCT, ANLGE].join(SEP) +
    ALPHA +
    '\\)$'
);
const RE_OKLAB = new RegExp(
  '^oklab\\(' +
    RE_S +
    [FLOAT_OR_PCT, FLOAT_OR_PCT, FLOAT_OR_PCT].join(SEP) +
    ALPHA +
    '\\)$'
);
const RE_OKLCH = new RegExp(
  '^oklch\\(' +
    RE_S +
    [FLOAT_OR_PCT, FLOAT_OR_PCT, ANLGE].join(SEP) +
    ALPHA +
    '\\)$'
);

export default function (value: string): ColorMode {
  let mode: ColorMode = 'hsl';

  for (let chk of input.autodetect) {
    mode = chk.test(value) as ColorMode;
    if (mode) break;
  }
  if (mode === 'css') {
    if (
      RE_RGB.test(value) ||
      RE_RGB_LEGACY.test(value) ||
      RE_RGBA_LEGACY.test(value)
    ) {
      mode = 'rgb';
    } else if (
      RE_HSL.test(value) ||
      RE_HSL_LEGACY.test(value) ||
      RE_HSLA_LEGACY.test(value)
    ) {
      mode = 'hsl';
    } else if (RE_LAB.test(value)) {
      mode = 'lab';
    } else if (RE_LCH.test(value)) {
      mode = 'lch';
    } else if (RE_OKLAB.test(value)) {
      mode = 'oklab';
    } else if (RE_OKLCH.test(value)) {
      mode = 'oklch';
    } else {
      mode = 'hsl';
    }
  }

  return mode;
}
