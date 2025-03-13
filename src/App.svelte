<script lang="ts">
  import css from 'css';
  import chroma from 'chroma-js';
  import exampleCss from './assets/example.css?raw';
  import Button from './lib/Button.svelte';
  import Textarea from './lib/Textarea.svelte';
  import getColorMode from './lib/getColorMode';
  import ADJUSTMENT_MODES from './lib/adjustmentModes';

  const CONVERTIBLE_COLOR_MODES: ColorMode[] = [
    'rgb',
    'hsl',
    'lab',
    'lch',
    'oklab',
    'oklch',
  ];

  let source: string = $state(exampleCss);
  let output: string = $state('');
  let ast: css.Stylesheet | undefined = $state();
  let rules: ColorRule[] = $state([]);
  let groups: ColorGroup[] = $state([]);
  let selectedGroup: ColorGroup | undefined = $state();
  let copied: boolean = $state(false);
  let groupCounter = 0;

  function parseCss() {
    ast = css.parse(source, { silent: true });

    if (
      ast?.stylesheet?.parsingErrors &&
      ast?.stylesheet?.parsingErrors?.length > 0
    ) {
      return;
    }

    rules = [];
    groups = [];
    selectedGroup = undefined;

    ast.stylesheet?.rules.forEach((rule) => {
      if (rule.type === 'rule') extractColors(rule);
    });
  }

  function extractColors(rule: css.Rule) {
    var sections: ColorSection[] = [];
    var colorItems: ColorItem[] = [];
    var sectionName: string | null = null;
    var ruleName = rule.selectors?.join(', ') ?? '';

    rule.declarations?.forEach((declaration) => {
      if (declaration.type === 'comment' && declaration.comment) {
        if (colorItems.length > 0) {
          sections.push({ name: sectionName, colorItems });
          colorItems = [];
        }
        sectionName = declaration.comment;
        return;
      }

      if (declaration.type !== 'declaration' || !declaration.value) return;

      let color: chroma.Color;
      const value = declaration.value;

      try {
        color = chroma(value);
      } catch {
        return;
      }

      const colorItem: ColorItem = {
        initialColor: color,
        initialValue: value,
        color: chroma(value),
        mode: getColorMode(value),
        rule: ruleName,
        property: declaration.property ?? '',
        declaration: declaration,
        group: null,
      };

      colorItems.push(colorItem);
    });

    if (colorItems.length > 0) {
      sections.push({ name: sectionName, colorItems });
    }

    if (sections.length > 0) {
      rules.push({ name: ruleName, sections });
    }
  }

  function newGroup() {
    groupCounter++;
    const adjustmentModeIndex = 0;

    selectedGroup = {
      name: String(groupCounter),
      colorItems: [],
      adjustmentModeIndex,
      adjustmentValues: Array.from(
        { length: ADJUSTMENT_MODES.length },
        (_, i) =>
          Array.from({ length: ADJUSTMENT_MODES[i].channels.length }, () => ({
            value: 0,
            enabled: false,
          }))
      ),
    };
    groups.push(selectedGroup);
  }

  function selectGroup(group: ColorGroup) {
    selectedGroup = group;
  }

  function addColorItemToGroup(colorItem: ColorItem) {
    if (groups.length === 0 || (!selectedGroup && !colorItem.group)) {
      newGroup();
    }

    if (!selectedGroup || colorItem.group) return;

    colorItem.group = selectedGroup;
    selectedGroup.colorItems.push(colorItem);
  }

  function removeColorItemFromGroup(colorItem: ColorItem) {
    if (!colorItem.group) return;

    colorItem.group.colorItems = colorItem.group.colorItems.filter(
      (item) => item !== colorItem
    );
    colorItem.group = null;
    colorItem.color = colorItem.initialColor;
    colorItem.declaration.value = colorItem.initialValue;
  }

  function setColorItemColor(colorItem: ColorItem, color: chroma.Color) {
    colorItem.color = color;

    if (colorItem.mode === 'hex') {
      colorItem.declaration.value = color.hex();
    } else if (CONVERTIBLE_COLOR_MODES.includes(colorItem.mode)) {
      colorItem.declaration.value = color.css(colorItem.mode as any);
    } else {
      colorItem.declaration.value = color.css('hsl');
    }
  }

  function remap(
    weight: number,
    a1: number,
    b1: number,
    a2: number,
    b2: number
  ) {
    return a2 + ((b2 - a2) * (weight - a1)) / (b1 - a1);
  }

  function adjustValue(
    initialValue: number,
    value: number,
    min: number = 0,
    max: number = 1,
    scale: number = 1
  ): number {
    if (value > 0) return remap(value / scale, 0, 1, initialValue, max);
    if (value < 0) return remap(value / scale, -1, 0, min, initialValue);
    return initialValue;
  }

  function adjustGroupColors(group: ColorGroup) {
    group.colorItems.forEach((colorItem) => {
      const adjustmentMode = ADJUSTMENT_MODES[group.adjustmentModeIndex];
      let color = colorItem.initialColor;
      const channelValues = adjustmentMode
        .getChannelValues(color)
        .map((val) => (Number.isNaN(val) ? 0 : val));

      for (const index in adjustmentMode.channels) {
        const adjustmentValue =
          group.adjustmentValues[group.adjustmentModeIndex][index];
        if (!adjustmentValue.enabled) {
          continue;
        }

        const channel = adjustmentMode.channels[index];
        const channelValue = channelValues[channel.channelIndex];
        const scale = channel.scale ?? 1;

        color = color.set(
          channel.channel,
          adjustValue(
            channelValue,
            adjustmentValue.value,
            channel.min ?? channelValue - scale,
            channel.max ?? channelValue + scale,
            channel.scale
          )
        );
      }

      setColorItemColor(colorItem, color);
    });
  }

  function deleteGroup(group: ColorGroup) {
    if (selectedGroup === group) {
      selectedGroup = undefined;
    }

    group.colorItems.forEach((colorItem) => {
      removeColorItemFromGroup(colorItem);
    });

    groups = groups.filter((item) => item !== group);
  }

  function produceOutput() {
    if (!ast) return;
    output = css.stringify(ast);
    copied = false;
  }

  function copyOutputToClipboard() {
    if (!output) return;
    navigator.clipboard.writeText(output);
    copied = true;
  }

  $effect(() => {
    if (selectedGroup) {
      adjustGroupColors(selectedGroup);
    }
  });
</script>

{#snippet colorList(
  colorItems: ColorItem[],
  functionOnClick: (colorItem: ColorItem) => void,
  hoverText: string,
  showGrouping: boolean = false
)}
  <ul class="grid grid-cols-6 text-xs font-mono break-words sm:grid-cols-8">
    {#each colorItems as colorItem}
      <li
        class="min-h-10 h-full {colorItem.color.hsl()[2] > 0.45
          ? 'text-black'
          : 'text-white'} border-2 {showGrouping && colorItem.group
          ? 'border-stone-500'
          : 'border-stone-900'}"
        style={colorItem.color.alpha() === 1
          ? ''
          : 'background: linear-gradient(to right, black 50%, white 50%);'}
      >
        <button
          title={`${colorItem.property}: ${colorItem.declaration.value}`}
          class="group relative block w-full h-full text-start {showGrouping &&
          colorItem.group
            ? 'cursor-not-allowed'
            : ''}"
          style="background: {colorItem.color.alpha() === 1
            ? colorItem.declaration.value
            : `linear-gradient(to bottom, ${colorItem.declaration.value} 85%, ${colorItem.color.alpha(1).css()} 85%)`};"
          onclick={() => functionOnClick(colorItem)}
        >
          {colorItem.property}
          {#if !(showGrouping && colorItem.group)}
            <div
              class="absolute inset-0 text-center bg-stone-900/75 text-stone-300 font-sans invisible group-hover:visible group-focus-visible:visible overflow-hidden"
            >
              {hoverText +
                (selectedGroup ? selectedGroup?.name : 'a new group')}
            </div>
          {/if}
        </button>
      </li>
    {/each}
  </ul>
{/snippet}

<main class="container mx-auto max-w-screen-md py-16 space-y-6">
  <div class="text-center space-y-4">
    <h1 class="font-bold text-5xl">CSS Palettery</h1>
    <p class="text-stone-400">A tool for changing CSS colors in bulk.</p>
  </div>
  <div class="space-y-4">
    <Textarea
      name="source"
      id="source"
      placeholder="Paste CSS code here..."
      rows={10}
      bind:value={source}
    />
    <div class="text-center">
      <Button onclick={parseCss}>Extract colors</Button>
    </div>
    {#if ast?.stylesheet?.parsingErrors && ast?.stylesheet?.parsingErrors?.length > 0}
      <div class="bg-rose-800 text-rose-200 p-4 font-mono">
        {#each ast?.stylesheet?.parsingErrors as parsingError}
          <p>{parsingError}</p>
        {/each}
      </div>
    {/if}
  </div>
  {#if !ast}
    <p>Click "Extract colors" to start.</p>
  {/if}
  {#if ast && rules.length === 0}
    <p>No colors found in the CSS code.</p>
  {/if}
  <ul class="max-h-[45vh] overflow-y-auto space-y-6">
    {#each rules as rule}
      <div
        class="mb-2 font-semibold sticky top-0 bg-stone-800 font-mono break-words z-10"
      >
        {rule.name}
      </div>
      {#each rule.sections as section}
        {#if section.name}
          <div class="mb-2 text-sm font-mono break-words">{section.name}</div>
        {/if}
        {@render colorList(
          section.colorItems,
          addColorItemToGroup,
          'Add to ',
          true
        )}
      {/each}
    {/each}
  </ul>

  {#snippet adjuster(channel: AdjustmentChannel, index: number)}
    {#if selectedGroup}
      {@const adjustmentValue =
        selectedGroup.adjustmentValues[selectedGroup.adjustmentModeIndex][
          index
        ]}
      <div class="w-full flex items-center justify-between">
        <label
          for={channel.channel}
          class="flex items-center gap-4 w-5/12 justify-between pr-4"
        >
          {channel.label}<input
            type="checkbox"
            id={channel.channel}
            bind:checked={adjustmentValue.enabled}
          />
        </label>
        {#if adjustmentValue.enabled}
          {@const scale = channel.scale ?? 1}
          <div class="flex items-center gap-4 w-7/12">
            <input
              type="range"
              min={channel.min ?? -scale}
              max={channel.max ?? scale}
              step={scale >= 10 ? 1 : 0.01}
              class="w-full"
              bind:value={adjustmentValue.value}
            />
            <input
              type="number"
              min={channel.min ?? -scale}
              max={channel.max ?? scale}
              step={scale >= 10 ? 1 : 0.01}
              class="bg-stone-700 w-14"
              bind:value={adjustmentValue.value}
            />
          </div>
        {/if}
      </div>
    {/if}
  {/snippet}

  {#if rules.length > 0}
    <div class="h-[45vh] flex flex-col">
      <div class="flex justify-between items-start text-nowrap">
        <ul class="flex bg-stone-800 w-full min-h-10 gap-1 overflow-x-auto">
          {#each groups as group}
            {@const adjustmentMode =
              ADJUSTMENT_MODES[group.adjustmentModeIndex]}
            {@const adjustmentValues =
              group.adjustmentValues[group.adjustmentModeIndex]}
            <li
              class="group flex h-10 bg-stone-700 border-b-2 {selectedGroup ===
              group
                ? 'border-stone-300'
                : 'border-stone-700'}"
            >
              <button
                class="p-2 hover:bg-stone-600 focus-visible:bg-stone-600 active:bg-stone-700"
                onclick={() => selectGroup(group)}
              >
                {group.name} - {adjustmentMode.label}
                {#each adjustmentValues as adjustmentValue, index}
                  {#if adjustmentValue.enabled}
                    {adjustmentMode.channels[index].channel.slice(-1) +
                      '=' +
                      adjustmentValue.value +
                      ' '}
                  {/if}
                {/each}
              </button>
              <button
                class="p-2 hover:bg-stone-600 focus-visible:bg-stone-600 active:bg-stone-700"
                onclick={() => deleteGroup(group)}>&#10005;</button
              >
            </li>
          {/each}
        </ul>
        <Button onclick={newGroup}>New group</Button>
      </div>
      {#if selectedGroup}
        <div class="overflow-y-auto grow">
          {#if selectedGroup.colorItems.length > 0}
            {@render colorList(
              selectedGroup.colorItems,
              removeColorItemFromGroup,
              'Remove from '
            )}
          {:else}
            <p>Click on some colors to add them to this group.</p>
          {/if}
        </div>
        <div class="bg-stone-800 px-4">
          <div class="space-x-4">
            <span class="font-bold">Adjust:</span>
            {#each ADJUSTMENT_MODES as adjustmentMode, index}
              <label for={adjustmentMode.label}>
                <input
                  type="radio"
                  name="currentAdjustment"
                  id={adjustmentMode.label}
                  value={index}
                  bind:group={selectedGroup.adjustmentModeIndex}
                />
                {adjustmentMode.label}
              </label>
            {/each}
          </div>
          {#each ADJUSTMENT_MODES[selectedGroup.adjustmentModeIndex].channels as channel, index}
            {@render adjuster(channel, index)}
          {/each}
        </div>
      {:else if groups.length > 0}
        <p>Select a group.</p>
      {:else}
        <p>Create a group.</p>
      {/if}
    </div>
  {/if}
  {#if ast}
    <div class="space-y-4">
      <div class="text-center">
        <Button onclick={produceOutput}>Generate CSS</Button>
      </div>
      {#if output}
        <div class="text-end space-x-2">
          {#if copied}
            <span>Copied!</span>
          {/if}
          <Button onclick={copyOutputToClipboard}>Copy to clipboard</Button>
        </div>
        <Textarea name="output" id="output" rows={10} bind:value={output} />
      {/if}
    </div>
  {/if}
</main>
<footer class="pb-16">
  <p class="text-center text-stone-400">
    Source code is available on <a
      href="https://github.com/teatov/css-palettery"
      rel="noopener noreferrer"
      class="text-stone-300 underline hover:text-stone-200 focus-visible:text-stone-200 active:text-stone-300"
      >GitHub</a
    >.
  </p>
</footer>
