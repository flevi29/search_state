<script lang="ts">
  import "../app.css";

  import { setContext } from "svelte";
  import {
    getSearchState,
    INDEX_UID,
    STATUS,
  } from "$lib/stores/search-state.svelte";
  import SearchBox from "./search-box.svelte";
  import SortBy from "./sort-by.svelte";

  const { children } = $props();

  const s = getSearchState("http://127.0.0.1:7700", "masteKey"),
    searchStateForContext = $derived(s.searchState?.value);

  setContext("state", {
    get val() {
      return searchStateForContext;
    },
  });
</script>

<div>
  <main>
    {#if s.searchState !== null}
      {@const { status, value } = s.searchState}

      {#if status === STATUS.OK}
        <div>
          <a href="./">estimated</a>
          <a href="./numbered-pagination">numbered</a>
        </div>

        <SearchBox indexUid={INDEX_UID} searchState={value} />

        <SortBy indexUid={INDEX_UID} searchState={value} />

        <div>
          {@render children()}
        </div>
      {:else if status === STATUS.INVALID_API_KEY}
        <div>
          <span>{value.name}: {value.message}</span>
        </div>
        {#if value.cause !== undefined}
          <div><span>{JSON.stringify(value.cause)}</span></div>
        {/if}
      {:else}
        <span>{value}</span>
      {/if}
    {:else}
      <span>...waiting</span>
    {/if}
  </main>
</div>
