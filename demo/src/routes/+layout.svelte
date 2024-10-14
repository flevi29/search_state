<script lang="ts">
  import "../app.css";

  import { searchState } from "$lib/stores/search-state.svelte";
  import { STATUS } from "$lib/stores/search-state.svelte";
  import ApiSettings from "./api-settings.svelte";
  import IndexSelector from "./index-selector.svelte";
  import SearchBox from "./search-box.svelte";
  // TODO: Fix this widget
  // import SortBy from "./sort-by.svelte";

  const { children } = $props();
  const { value: searchStateValue, isHostAndApiKeySet } = searchState;
  // TODO: Add UI logic for when there are no indexes
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
          <IndexSelector />

          <SearchBox
            indexUid={searchState.selectedIndex!}
            searchState={value}
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
