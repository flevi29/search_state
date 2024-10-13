<script lang="ts">
  import { onDestroy } from "svelte";
  import { searchState } from "$lib/stores/search-state.svelte";

  let dialogElement = $state<HTMLDialogElement | null>(null),
    localHost = $state<string>(""),
    localApiKey = $state<string>("");

  function close(): void {
    if (dialogElement !== null && dialogElement.open) {
      dialogElement.close();
    }
  }

  const { hostAndApiKey } = searchState;

  function showModal(): void {
    if (dialogElement !== null && !dialogElement.open) {
      const [host, apiKey] = $hostAndApiKey;
      localHost = host ?? "";
      localApiKey = apiKey ?? "";
      dialogElement.showModal();
    }
  }

  onDestroy(close);
</script>

<button type="button" onclick={showModal}>API Settings</button>

<dialog bind:this={dialogElement}>
  <div>
    <input
      type="text"
      spellcheck="false"
      value={localHost}
      placeholder="host"
      onfocusout={(event) => {
        localHost = event.currentTarget.value;
      }}
    />

    <input
      type="text"
      spellcheck="false"
      value={localApiKey}
      placeholder="apiKey"
      onfocusout={(event) => {
        localApiKey = event.currentTarget.value;
      }}
    />
  </div>

  <hr />

  <div>
    <button type="button" onclick={close}>Close</button>

    <button
      type="button"
      onclick={() => {
        searchState.setHostAndApiKey(localHost, localApiKey);
        close();
      }}>Save</button
    >
  </div>
</dialog>
