<script lang="ts">
  import { searchState } from "$lib/stores/search-state.svelte";
</script>

<label for="index">Chosen index:</label>
<select
  id="index"
  value={searchState.selectedIndex}
  disabled={searchState.indexes !== null &&
    Object.keys(searchState.indexes).length === 1}
  oninput={function () {
    searchState.setSelectedIndex(this.value);
  }}
>
  {#if searchState.indexes !== null}
    {#each Object.entries(searchState.indexes) as [uid, { numberOfDocuments }]}
      <option selected={searchState.selectedIndex === uid} value={uid}
        >{uid} ({numberOfDocuments})</option
      >
    {/each}
  {/if}
</select>
