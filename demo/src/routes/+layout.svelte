<script lang="ts">
  import "../app.css";

  import { searchState } from "$lib/stores/search-state.svelte";
  import { INDEX_UID, STATUS } from "$lib/stores/search-state.svelte";
  import HostAndApiKeySelector from "./host-and-api-key-selector.svelte";
  import SearchBox from "./search-box.svelte";
  import SortBy from "./sort-by.svelte";

  const { children } = $props();
  const { value } = searchState;
</script>

<div>
  <main>
    <HostAndApiKeySelector />

    <div>
      <a href="./">estimated</a>
      <a href="./numbered-pagination">numbered</a>
    </div>

    {#if $value !== null}
      {#if $value.status === STATUS.OK}
        <SearchBox indexUid={INDEX_UID} searchState={$value.value} />

        <SortBy indexUid={INDEX_UID} searchState={$value.value} />

        <div>
          {@render children()}
        </div>
      {:else}
        <span
          style:color={$value.status === STATUS.INVALID_API_KEY
            ? "#969600"
            : "red"}
          style:white-space="pre-wrap">{$value.value}</span
        >
      {/if}
    {:else}
      <span style:color="blue">loading...</span>
    {/if}
  </main>
</div>
