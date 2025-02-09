<script lang="ts">
  const {
    page,
    totalPages,
    setPage,
  }: { page: number; totalPages: number; setPage: (page: number) => void } =
    $props();

  const pages = $derived.by(() => {
    const pagesArr: number[] = [];

    const first = page < 3 ? 1 : page - 2;
    const last =
      page + 2 > totalPages ? (totalPages === 0 ? 1 : totalPages) : page + 2;

    for (let i = first; i <= last; i += 1) {
      pagesArr.push(i);
    }

    return pagesArr;
  });
</script>

<button type="button" disabled={page === 1} onclick={() => setPage(page - 1)}
  >Prev</button
>

{#each pages as pageElement}
  <button
    type="button"
    disabled={pageElement === page}
    onclick={() => setPage(pageElement)}>{pageElement}</button
  >
{/each}

<button
  type="button"
  disabled={page === totalPages}
  onclick={() => setPage(page + 1)}>Next</button
>
