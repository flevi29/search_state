<script lang="ts">
  import type { SearchState } from "@search-state/lib";
  import {
    getSortByWidget,
    translations,
    sortOptionsKeys,
    type SortKey,
  } from "$lib/stores/sort.svelte";

  // TODO: This whole thing is problematic with custom indexes

  const {
    indexUid,
    searchState,
  }: { indexUid: string; searchState: SearchState } = $props();

  const w = $derived(getSortByWidget(indexUid, searchState));

  function getTranslation(key: SortKey) {
    return translations[key] ?? key;
  }

  $effect(() => w.unmount);
</script>

<label for="sort-by">Sort by:</label>
<select
  id="sort-by"
  value={w.selectedSortKey}
  oninput={function () {
    w.setSort(this.value as SortKey);
  }}
>
  {#each sortOptionsKeys as key}
    <option selected={key === w.selectedSortKey} value={key}
      >{getTranslation(key)}</option
    >
  {/each}
</select>
