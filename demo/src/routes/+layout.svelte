<script lang="ts">
  import "../app.css";

  import { onDestroy } from "svelte";
  import { searchState } from "$lib/stores/search-state.svelte";
  import { getRouterState } from "$lib/stores/router-state";
  import { STATUS } from "$lib/stores/search-state.svelte";
  import ApiSettings from "./api-settings.svelte";
  import IndexSelector from "./index-selector.svelte";
  import SearchBox from "./search-box.svelte";
  // TODO: Fix/Adapt this widget to indexes woth unknown sortable properties
  // import SortBy from "./sort-by.svelte";

  const { children } = $props();
  const { value: searchStateValue, isHostAndApiKeySet } = searchState;
  const routerState = getRouterState();

  // TODO: Add UI logic for when there are no indexes

  onDestroy(routerState.unsubscribe);
</script>

<div>
  <main>
    <div>
      <ApiSettings />
    </div>

    {#if $isHostAndApiKeySet}
      {#if $searchStateValue !== null}
        {@const { status, value } = $searchStateValue}

        {#if status === STATUS.OK}
          <!-- TODO: when exactly is indexes null? -->
          {#if searchState.indexes !== null && searchState.indexes.size !== 0}
            <IndexSelector />

            <SearchBox
              indexUid={searchState.selectedIndex!}
              searchState={value}
              routerState={routerState.value}
            />

            <!-- <SortBy indexUid={searchState.selectedIndex!} searchState={value} /> -->

            <div>
              <a href="./">estimated</a>
              <a href="./numbered-pagination">numbered</a>
            </div>

            <div>
              {@render children()}
            </div>
          {:else}
            <div>
              <span style:color="gray">There are no indexes to search.</span>
            </div>
          {/if}
        {:else}
          <div style:padding="0.5rem">
            <div
              style:padding="0.5rem"
              style:max-width="max-content"
              style:border="solid"
              style:border-color={status === STATUS.INVALID_API_KEY
                ? "#787800"
                : "#de0000"}
              style:background-color={status === STATUS.INVALID_API_KEY
                ? "#ffffd8"
                : "#ffeded"}
            >
              <span
                style:color={status === STATUS.INVALID_API_KEY
                  ? "#787800"
                  : "#de0000"}
                style:white-space="pre-wrap">{value}</span
              >
            </div>
          </div>
        {/if}
      {:else}
        <span style:color="blue">loading...</span>
      {/if}
    {:else}
      <div>
        <span style:color="gray">Host or API key is not set.</span>
      </div>
    {/if}
  </main>
</div>
