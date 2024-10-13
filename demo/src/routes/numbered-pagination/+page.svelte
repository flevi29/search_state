<script lang="ts">
  import { INDEX_UID, searchState } from "$lib/stores/search-state.svelte";
  import { getHitsWithNumberedPaginationWidget } from "$lib/stores/hits-with-numbered-pagination.svelte";
  import HitsPerPage from "$lib/components/hits-per-page.svelte";
  import Hits from "$lib/components/hits.svelte";
  import NumberedPagination from "$lib/components/numbered-pagination.svelte";

  const w = $derived(
    getHitsWithNumberedPaginationWidget(INDEX_UID, searchState.rawValue!),
  );

  $effect(() => w.unmount);
</script>

{#if w.hitsPerPage !== null}
  <HitsPerPage
    initialHitsPerPage={w.initialHitsPerPage}
    hitsPerPage={w.hitsPerPage}
    setHitsPerPage={w.setHitsPerPage}
  />
{/if}

<div>
  <span>Total hits: {w.totalHits ?? "waiting for results"}</span>
</div>

{#if w.hits !== null}
  <Hits hits={w.hits} />
{/if}

{#if w.page !== null && w.totalPages !== null}
  <NumberedPagination
    page={w.page}
    totalPages={w.totalPages}
    setPage={w.setPage}
  />
{/if}
