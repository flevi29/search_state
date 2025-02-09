<script lang="ts">
  const {
    page,
    hasPrevious,
    previousPage,
    hasNext,
    nextPage,
  }: {
    page: number;
    hasPrevious: boolean;
    previousPage: () => void;
    hasNext: boolean;
    nextPage: () => void;
  } = $props();
</script>

<button type="button" disabled={!hasPrevious} onclick={() => previousPage()}
  >Prev</button
>

<button type="button" disabled={!hasNext} onclick={() => nextPage()}
  >Next</button
>

<span>Page: {page}</span>
