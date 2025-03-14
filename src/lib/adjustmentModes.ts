export default [
  {
    label: 'HSL',
    getChannelValues: (color) => color.hsl(),
    channels: [
      {
        label: 'Hue',
        channel: 'hsl.h',
        channelIndex: 0,
        scale: 180,
      },
      {
        label: 'Saturation',
        channel: 'hsl.s',
        channelIndex: 1,
      },
      {
        label: 'Lightness',
        channel: 'hsl.l',
        channelIndex: 2,
      },
    ],
  },
  {
    label: 'OKLCH',
    getChannelValues: (color) => color.oklch(),
    channels: [
      {
        label: 'Lightness',
        channel: 'oklch.l',
        channelIndex: 0,
      },
      {
        label: 'Chromacity',
        channel: 'oklch.c',
        channelIndex: 1,
      },
      {
        label: 'Hue',
        channel: 'oklch.h',
        channelIndex: 2,
        scale: 180,
      },
    ],
  },
  {
    label: 'RGB',
    getChannelValues: (color) => color.rgb(),
    channels: [
      {
        label: 'Red',
        channel: 'rgb.r',
        channelIndex: 0,
        scale: 255,
      },
      {
        label: 'Green',
        channel: 'rgb.g',
        channelIndex: 1,
        scale: 255,
      },
      {
        label: 'Blue',
        channel: 'rgb.b',
        channelIndex: 2,
        scale: 255,
      },
    ],
  },
] as AdjustmentMode[];
