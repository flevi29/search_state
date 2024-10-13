<script lang="ts">
  import type { SearchState } from "$rootSrc/mod";
  import {
    getSortByWidget,
    translations,
    sortOptionsKeys,
    type SortKey,
  } from "$lib/stores/sort.svelte";

  const {
    indexUid,
    searchState,
  }: { indexUid: string; searchState: SearchState } = $props();

  const w = $derived(getSortByWidget(indexUid, searchState));

  function setSortFromUserInput(this: HTMLSelectElement) {
    w.setSort(this.value as SortKey);
  }

  function getTranslation(key: SortKey) {
    return translations[key] ?? key;
  }

  $effect(() => w.unmount);
</script>

<label for="sort-by">Sort by:</label>
<select id="sort-by" value={w.selectedSortKey} oninput={setSortFromUserInput}>
  {#each sortOptionsKeys as key}
    <option selected={key === w.selectedSortKey} value={key}
      >{getTranslation(key)}</option
    >
  {/each}
</select>
