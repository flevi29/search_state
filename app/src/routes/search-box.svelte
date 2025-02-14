<script lang="ts">
  import type { RouterState, SearchState } from "@search-state/lib";
  import { getSearchBoxWidget } from "$lib/stores/search-box.svelte";
  import DebouncedTextInput from "$lib/components/debounced-text-input.svelte";

  const {
    indexUid,
    searchState,
    routerState,
  }: { indexUid: string; searchState: SearchState; routerState: RouterState } =
    $props();

  const w = $derived(getSearchBoxWidget(indexUid, searchState, routerState));
  const value = $derived(w.q ?? "");

  $effect(() => w.unmount);
</script>

<DebouncedTextInput {value} placeholder="Search..." onValueChanged={w.setQ} />
