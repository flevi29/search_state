<script lang="ts">
  const { hits }: { hits: unknown[] } = $props();
</script>

<div style:white-space="break-spaces">
  <span>{JSON.stringify(hits, null, 2)}</span>
</div>
