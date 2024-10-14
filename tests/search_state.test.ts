import { assertEquals, assertExists, assertIsError } from "@std/assert";
import { stub } from "@std/testing/mock";
import { MeiliSearch } from "meilisearch";
import { SearchBox, SearchState } from "../src/mod.ts";

function getSearchState() {
  const client = new MeiliSearch({
    host: "127.0.0.1:7700",
    apiKey: "masterKey",
  });
  const searchState = new SearchState(client);
  searchState.start();

  return {
    value: searchState,
    [Symbol.dispose]() {
      searchState.stop();
    },
  };
}

Deno.test(`Test ${SearchState.name}`, async (t) => {
  await t.step(
    "should only call `fetch` once after synchronous tasks finished running",
    async () => {
      using fetchStub = stub(
        globalThis,
        "fetch",
        () => Promise.resolve(new Response()),
      );
      using searchState = getSearchState();

      const searchBox = new SearchBox(searchState.value, "uhh", () => {});

      for (const q of ["once", "twice", "thrice", "four times"]) {
        searchBox.setQ(q);
      }

      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));

      assertEquals(fetchStub.calls.length, 1);

      const body = fetchStub.calls[0]!.args[1]?.body;
      assertExists(body);

      assertEquals(
        body,
        JSON.stringify({ queries: [{ indexUid: "uhh", q: "four times" }] }),
      );
    },
  );

  await t.step(
    "should abort previous unfinished running `fetch` calls",
    async () => {
      let isFirst = true;
      using fetchStub = stub(
        globalThis,
        "fetch",
        async (_, requestInit) => {
          const signal = requestInit?.signal;
          if (signal == null) {
            throw new Error("signal needs to be provided");
          }

          if (isFirst) {
            isFirst = false;

            let listener: (() => void) | null = null;
            return await new Promise<Response>((_, reject) => {
              listener = () => reject(signal.reason);
              signal.addEventListener("abort", listener);
            }).finally(() => {
              if (listener !== null) {
                signal.removeEventListener("abort", listener);
              }
            });
          }

          return await Promise.resolve(new Response());
        },
      );
      using searchState = getSearchState();

      const searchBox = new SearchBox(searchState.value, "uhh", () => {});

      searchBox.setQ("one");
      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));
      searchBox.setQ("two");
      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));

      assertEquals(fetchStub.calls.length, 2);
      const [first, second] = await Promise.allSettled(
        fetchStub.calls.map((v) => v.returned),
      );

      assertEquals(first, { status: "rejected", reason: {} });
      assertEquals(second?.status, "fulfilled");
    },
  );
});
