<script lang="ts">
  import { searchState } from "$lib/stores/search-state.svelte";
</script>

<label for="index">Chosen index:</label>
<select
  id="index"
  value={searchState.selectedIndex}
  oninput={function () {
    searchState.setSelectedIndex(this.value);
  }}
>
  {#if searchState.indexes !== null}
    {#each searchState.indexes as [uid, { numberOfDocuments }]}
      <option selected={searchState.selectedIndex === uid} value={uid}
        >{uid} ({numberOfDocuments})</option
      >
    {/each}
  {/if}
</select>
