<script lang="ts">
  import css from 'css';
  import chroma from 'chroma-js';
  import exampleCss from './assets/example.css?raw';
  import Button from './lib/Button.svelte';

  type ColorSpace = 'hex' | 'rgb' | 'hsl';

  type ColorItem = {
    initialColor: chroma.Color;
    color: chroma.Color;
    space: ColorSpace;
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

  let source: string = $state(exampleCss);
  let output: string = $state('');
  let ast: css.Stylesheet | undefined = $state();
  let rules: ColorRule[] = $state([]);
  let groups: ModificationGroup[] = $state([]);
  let selectedGroup: ModificationGroup | undefined = $state();
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
      const cssValue = declaration.value.replaceAll('deg', '');

      try {
        color = chroma(cssValue);
      } catch {
        return;
      }

      let space: ColorSpace = 'hsl';

      if (cssValue.startsWith('#')) {
        space = 'hex';
      } else if (cssValue.startsWith('rgb')) {
        space = 'rgb';
      }

      const colorItem: ColorItem = {
        initialColor: color,
        color: chroma(cssValue),
        space: space,
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

    selectedGroup = {
      name: 'New group ' + groupCounter,
      colorItems: [],
      adjustHue: false,
      hueAdjustment: 0,
      adjustSaturation: false,
      saturationAdjustment: 0,
      adjustLightness: false,
      lightnessAdjustment: 0,
    };
    groups.push(selectedGroup);
  }

  function selectGroup(group: ModificationGroup) {
    selectedGroup = group;
  }

  function addColorItemToGroup(colorItem: ColorItem) {
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
    setColorItemColor(colorItem, colorItem.initialColor);
  }

  function setColorItemColor(colorItem: ColorItem, color: chroma.Color) {
    colorItem.color = color;

    if (colorItem.space === 'hex') {
      colorItem.declaration.value = color.hex();
    } else if (colorItem.space === 'rgb') {
      colorItem.declaration.value = color.css();
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
    max: number = 1,
    min: number = 0,
    scale: number = 1
  ): number {
    if (value > 0) return remap(value / scale, 0, 1, initialValue, max);
    if (value < 0) return remap(value / scale, -1, 0, min, initialValue);
    return initialValue;
  }

  function updateGroupColors(group: ModificationGroup) {
    group.colorItems.forEach((colorItem) => {
      let color = colorItem.initialColor;
      const hsl = color.hsl();

      if (group.adjustHue) {
        color = color.set(
          'hsl.h',
          adjustValue(
            hsl[0],
            group.hueAdjustment,
            hsl[0] + 180,
            hsl[0] - 180,
            180
          )
        );
      }
      if (group.adjustSaturation) {
        color = color.set(
          'hsl.s',
          adjustValue(hsl[1], group.saturationAdjustment)
        );
      }
      if (group.adjustLightness) {
        color = color.set(
          'hsl.l',
          adjustValue(hsl[2], group.lightnessAdjustment)
        );
      }

      setColorItemColor(colorItem, color);
    });
  }

  function deleteGroup(group: ModificationGroup) {
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
      selectedGroup.adjustHue;
      selectedGroup.hueAdjustment;
      selectedGroup.adjustSaturation;
      selectedGroup.saturationAdjustment;
      selectedGroup.adjustLightness;
      selectedGroup.lightnessAdjustment;
      updateGroupColors(selectedGroup);
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
        class="min-h-10 h-full {colorItem.color.hsl()[2] > 0.45 &&
        colorItem.color.alpha() > 0.75
          ? 'text-black'
          : 'text-white'} border-2 {showGrouping && colorItem.group
          ? 'border-stone-500'
          : 'border-stone-900'}"
        style="background-color: {colorItem.declaration.value};"
      >
        <button
          class="group relative block w-full h-full text-start {showGrouping &&
          colorItem.group
            ? 'cursor-not-allowed'
            : ''}"
          onclick={() => functionOnClick(colorItem)}
        >
          {colorItem.property}
          {#if !(showGrouping && colorItem.group)}
            <div
              class="absolute inset-0 text-center bg-stone-900/75 text-stone-300 font-sans invisible group-hover:visible group-focus-visible:visible"
            >
              {hoverText}
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
    <form action="/">
      <textarea
        name="source"
        id="source"
        class="w-full bg-stone-800 font-mono placeholder-stone-500"
        placeholder="Paste CSS code here..."
        rows="10"
        bind:value={source}
      ></textarea>
    </form>
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
        class="mb-2 font-semibold sticky top-0 bg-stone-800 font-mono break-words"
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
          'Add to group',
          true
        )}
      {/each}
    {/each}
  </ul>

  {#snippet modificator(
    checkboxName: keyof ModificationGroup,
    valueName: keyof ModificationGroup,
    label: string,
    scale: number = 1
  )}
    {#if selectedGroup}
      <div class="w-full flex items-center justify-between">
        <label
          for={checkboxName}
          class="flex items-center gap-4 w-5/12 justify-between pr-4"
          >{label}<input
            type="checkbox"
            name={checkboxName}
            id={checkboxName}
            bind:checked={selectedGroup[checkboxName] as boolean}
          />
        </label>
        {#if selectedGroup[checkboxName]}
          <div class="flex items-center gap-4 w-7/12">
            <input
              type="range"
              name="{valueName}Range"
              id="{valueName}Range"
              min="-{scale}"
              max={scale}
              step={scale >= 10 ? 1 : 0.01}
              class="w-full"
              bind:value={selectedGroup[valueName]}
            />
            <input
              type="number"
              name="{valueName}Number"
              id="{valueName}Number"
              min="-{scale}"
              max={scale}
              step={scale >= 10 ? 1 : 0.01}
              class="bg-stone-700 w-14"
              bind:value={selectedGroup[valueName]}
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
            <li
              class="group flex h-10 bg-stone-700 border-b-2 {selectedGroup ===
              group
                ? 'border-stone-300'
                : 'border-stone-700'}"
            >
              <button
                class="p-2 hover:bg-stone-600 focus-visible:bg-stone-600 active:bg-stone-700"
                onclick={() => selectGroup(group)}>{group.name}</button
              >
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
              'Remove from group'
            )}
          {:else}
            <p>Click on some colors to add them to this group.</p>
          {/if}
        </div>
        <div class="bg-stone-800 px-4">
          <p class="font-bold text-sm">Adjust:</p>
          {@render modificator('adjustHue', 'hueAdjustment', 'Hue', 360 / 2)}
          {@render modificator(
            'adjustSaturation',
            'saturationAdjustment',
            'Saturation'
          )}
          {@render modificator(
            'adjustLightness',
            'lightnessAdjustment',
            'Lightness'
          )}
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
        <div class="text-end">
          <Button onclick={copyOutputToClipboard}
            >{copied ? 'Copied!' : 'Copy to clipboard'}</Button
          >
        </div>
        <textarea
          name="output"
          id="output"
          class="w-full bg-stone-800 font-mono placeholder-stone-500"
          rows="10"
          bind:value={output}
        ></textarea>
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
