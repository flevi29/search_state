<script lang="ts">
  const {
    initialHitsPerPage,
    hitsPerPage,
    setHitsPerPage,
  }: {
    initialHitsPerPage: number;
    hitsPerPage: number;
    setHitsPerPage: (hitsPerPage: number) => void;
  } = $props();

  const options = [1, 2, 5, 10, 20];
</script>

<label for="hitsPerPage">Hits per page:</label>
<select
  id="hitsPerPage"
  value={hitsPerPage}
  oninput={function () {
    setHitsPerPage(Number(this.value));
  }}
>
  {#each options as option}
    <option>{option}</option>
  {/each}
</select>
