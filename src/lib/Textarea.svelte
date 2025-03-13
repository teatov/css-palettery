<script lang="ts">
  import type { HTMLTextareaAttributes } from 'svelte/elements';

  let { value = $bindable(), ...props }: HTMLTextareaAttributes = $props();

  let textarea: HTMLTextAreaElement;
  let lineNumbersDiv: HTMLDivElement;

  $effect(() => {
    const ro = new ResizeObserver(() => {
      if (!textarea) {
        return;
      }
      const rect = textarea.getBoundingClientRect();
      lineNumbersDiv.style.height = `${rect.height}px`;
      displayLineNumbers();
    });
    ro.observe(textarea);
  });

  const displayLineNumbers = () => {
    lineNumbersDiv.innerHTML = Array.from(
      {
        length: textarea.value.split('\n').length,
      },
      (_, i) => `<div>${i + 1}</div>`
    ).join('');
  };
</script>

<div class="flex w-full font-mono gap-2">
  <div
    bind:this={lineNumbersDiv}
    class="text-right overflow-hidden text-stone-500"
  ></div>
  <textarea
    bind:this={textarea}
    bind:value
    oninput={displayLineNumbers}
    onscroll={() => (lineNumbersDiv.scrollTop = textarea.scrollTop)}
    {...props}
    class="bg-stone-800 placeholder-stone-500 w-full whitespace-nowrap"
  ></textarea>
</div>
