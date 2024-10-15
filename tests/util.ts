import { MeiliSearch } from "meilisearch";
import { SearchState } from "../src/mod.ts";

const host = Deno.env.get("HOST") ?? "127.0.0.1:7700",
  apiKey = Deno.env.get("API_KEY") ?? "masterKey";

export async function pingAndGetMeiliSearch(): Promise<MeiliSearch> {
  const client = new MeiliSearch({ host: host, apiKey });

  const { status } = await client.health();
  if (status === "available") {
    return client;
  }

  throw new Error(
    `Meilisearch at ${host} could be reached, but it's unavailable`,
  );
}

export function getSearchState(
  client: MeiliSearch,
): Disposable & { value: SearchState } {
  // TODO: Second argument error callback, so we can check that it didn't err internally
  const searchState = new SearchState(client);
  searchState.start();

  return {
    value: searchState,
    [Symbol.dispose]() {
      searchState.stop();
    },
  };
}
