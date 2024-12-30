<script lang="ts">
  import type { HTMLButtonAttributes } from 'svelte/elements';

  let { children, ...rest }: HTMLButtonAttributes = $props();
</script>

<button
  {...rest}
  class="bg-stone-300 text-stone-800 font-semibold p-2 text-nowrap hover:bg-stone-200 active:bg-stone-300"
  >{@render children?.()}</button
>
