<script lang="ts">
  import { INDEX_UID, searchState } from "$lib/stores/search-state.svelte";
  import { getHitsWithPaginationWidget } from "$lib/stores/hits-with-pagination.svelte";
  import HitsPerPage from "$lib/components/hits-per-page.svelte";
  import Hits from "$lib/components/hits.svelte";
  import Pagination from "$lib/components/pagination.svelte";

  const w = $derived(getHitsWithPaginationWidget(INDEX_UID, searchState.rawValue!));

  $effect(() => w.unmount);
</script>

{#if w.limit !== null}
  <HitsPerPage
    initialHitsPerPage={w.initialLimit}
    hitsPerPage={w.limit}
    setHitsPerPage={w.setLimit}
  />
{/if}

<div>
  <span
    >Estimated total hits: {w.estimatedTotalHits ?? "waiting for results"}</span
  >
</div>

{#if w.hits !== null}
  <Hits hits={w.hits} />
{/if}

{#if w.page !== null}
  <Pagination
    page={w.page}
    hasPrevious={w.hasPrevious}
    previousPage={w.previousPage}
    hasNext={w.hasNext}
    nextPage={w.nextPage}
  />
{/if}
