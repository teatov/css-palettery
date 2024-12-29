<script lang="ts">
  import css from 'css';

  let source = $state('');
  let ast: css.Stylesheet | undefined = $state();

  function parseCss() {
    ast = css.parse(source, { silent: true });

    if (
      ast?.stylesheet?.parsingErrors &&
      ast?.stylesheet?.parsingErrors?.length > 0
    ) {
      return;
    }
  }
</script>

<main class="container mx-auto max-w-screen-md py-16 space-y-6">
  <div class="text-center space-y-4">
    <h1 class="font-bold text-5xl">CSS Palettery</h1>
    <p class="text-stone-400">
      A tool for changing CSS colors in bulk
    </p>
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
  <pre>{JSON.stringify(ast, null, 2)}</pre>
</main>
