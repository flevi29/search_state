import { assertEquals, assertExists } from "@std/assert";
import { stub } from "@std/testing/mock";
import { MeiliSearch } from "meilisearch";
import { SearchBox, SearchState } from "../src/mod.ts";

// TODO: make use of using keyword: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-2.html
Deno.test(`Test ${SearchState.name}`, async (t) => {
  using fetchStub = stub(
    globalThis,
    "fetch",
    () => Promise.resolve(new Response()),
  );

  await t.step(
    "should only call `fetch` once after synchronous tasks finished running",
    async () => {
      const client = new MeiliSearch({
        host: "127.0.0.1:7700",
        apiKey: "masterKey",
      });
      const searchState = new SearchState(client);
      const searchBox = new SearchBox(searchState, "uhh", () => {});
      searchState.start();

      try {
        for (const q of ["once", "twice", "thrice", "four times"]) {
          searchBox.setQ(q);
        }

        await new Promise((resovle) => setTimeout(resovle));

        assertEquals(fetchStub.calls.length, 1);

        const body = fetchStub.calls[0]?.args[1]?.body;
        assertExists(body);

        assertEquals(
          body,
          JSON.stringify({ queries: [{ indexUid: "uhh", q: "four times" }] }),
        );
      } finally {
        searchState.stop();
      }
    },
  );
});
