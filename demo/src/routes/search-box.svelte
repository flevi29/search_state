<script lang="ts">
  import type { SearchState } from "$rootSrc/mod";
  import { onDestroy } from "svelte";
  import { getSearchBoxWidget } from "$lib/stores/search-box.svelte";
  import DebouncedTextInput from "$lib/components/debounced-text-input.svelte";

  const {
    indexUid,
    searchState,
  }: { indexUid: string; searchState: SearchState } = $props();

  const w = $derived(getSearchBoxWidget(indexUid, searchState));
  const value = $derived(w.q ?? "");

  onDestroy(() => w.unmount());
</script>

<DebouncedTextInput {value} onValueChanged={w.setQ} />
