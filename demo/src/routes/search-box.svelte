<script lang="ts">
  import type { SearchState } from "$rootSrc/mod";
  import { getSearchBoxWidget } from "$lib/stores/search-box.svelte";
  import DebouncedTextInput from "$lib/components/debounced-text-input.svelte";

  const {
    indexUid,
    searchState,
  }: { indexUid: string; searchState: SearchState } = $props();

  const w = $derived(getSearchBoxWidget(indexUid, searchState));
  const value = $derived(w.q ?? "");

  $effect(() => w.unmount);
</script>

<DebouncedTextInput {value} placeholder="Search..." onValueChanged={w.setQ} />
