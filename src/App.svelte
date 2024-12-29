<script lang="ts">
  import css from 'css';
  import chroma from 'chroma-js';
  import exampleCss from './assets/example.css?raw';

  type ColorItem = {
    initialColor: chroma.Color;
    color: chroma.Color;
    isHex: boolean;
    rule: string;
    property: string;
    declaration: css.Declaration;
  };

  type ColorSection = { name: string | undefined; colorItems: ColorItem[] };

  type ColorRule = { name: string; sections: ColorSection[] };

  let source = $state(exampleCss);
  let ast: css.Stylesheet | undefined = $state();
  let rules: ColorRule[] = $state([]);

  function parseCss() {
    ast = css.parse(source, { silent: true });

    if (
      ast?.stylesheet?.parsingErrors &&
      ast?.stylesheet?.parsingErrors?.length > 0
    ) {
      return;
    }

    rules = [];

    ast.stylesheet?.rules.forEach((rule) => {
      if (rule.type === 'rule') extractColors(rule);
    });
  }

  function extractColors(rule: css.Rule) {
    var sections: ColorSection[] = [];
    var colorItems: ColorItem[] = [];
    var sectionName: string | undefined = undefined;
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

      let colorValue: chroma.Color;

      try {
        colorValue = chroma(declaration.value);
      } catch {
        return;
      }

      const color: ColorItem = {
        initialColor: colorValue,
        color: chroma(declaration.value),
        isHex: declaration.value.startsWith('#'),
        rule: ruleName,
        property: declaration.property ?? '',
        declaration: declaration,
      };

      colorItems.push(color);
    });

    if (colorItems.length > 0) {
      sections.push({ name: sectionName, colorItems });
    }

    if (sections.length > 0) {
      rules.push({ name: ruleName, sections });
    }
  }
</script>

<main class="container mx-auto max-w-screen-md py-16 space-y-6">
  <div class="text-center space-y-4">
    <h1 class="font-bold text-5xl">CSS Palettery</h1>
    <p class="text-stone-400">A tool for changing CSS colors in bulk</p>
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
      <button
        class="bg-stone-300 text-stone-800 font-semibold p-2"
        onclick={parseCss}>Extract colors</button
      >
    </div>
    {#if ast?.stylesheet?.parsingErrors && ast?.stylesheet?.parsingErrors?.length > 0}
      <div class="bg-rose-800 text-rose-200 p-4 font-mono">
        {#each ast?.stylesheet?.parsingErrors as parsingError}
          <p>{parsingError}</p>
        {/each}
      </div>
    {/if}
  </div>
  <ul class="max-h-[50vh] overflow-y-auto font-mono space-y-6 break-words">
    {#each rules as rule}
      <div class="mb-2 font-semibold sticky top-0 bg-stone-900">
        {rule.name}
      </div>
      {#each rule.sections as section}
        {#if section.name}
          <div class="mb-2 text-sm">// {section.name}</div>
        {/if}
        <ul class="grid grid-cols-8 gap-1 text-xs">
          {#each section.colorItems as colorItem}
            <li
              class="min-h-10 h-full {colorItem.color.hsl()[2] > 0.5 &&
              colorItem.color.alpha() > 0.75
                ? 'text-black'
                : 'text-white'}"
              style="background-color: {colorItem.declaration.value};"
            >
              {colorItem.property}
            </li>
          {/each}
        </ul>
      {/each}
    {/each}
  </ul>
</main>
