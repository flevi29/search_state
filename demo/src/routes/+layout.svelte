<script lang="ts">
  import "../app.css";

  import { searchState } from "$lib/stores/search-state.svelte";
  import { INDEX_UID, STATUS } from "$lib/stores/search-state.svelte";
  import ApiSettings from "./api-settings.svelte";
  import SearchBox from "./search-box.svelte";
  import SortBy from "./sort-by.svelte";

  const { children } = $props();
  const { value: searchStateValue } = searchState;
  const searchStateRune = $derived($searchStateValue);
</script>

<div>
  <main>
    <ApiSettings />

    <div>
      <a href="./">estimated</a>
      <a href="./numbered-pagination">numbered</a>
    </div>

    {#if searchStateRune !== null}
      {@const { status, value } = searchStateRune}

      {#if status === STATUS.OK}
        <SearchBox indexUid={INDEX_UID} searchState={value} />

        <SortBy indexUid={INDEX_UID} searchState={value} />

        <div>
          {@render children()}
        </div>
      {:else}
        <span
          style:color={status === STATUS.INVALID_API_KEY ? "#969600" : "red"}
          style:white-space="pre-wrap">{value}</span
        >
      {/if}
    {:else}
      <span style:color="blue">loading...</span>
    {/if}
  </main>
</div>
