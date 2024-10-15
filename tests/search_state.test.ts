import { assertEquals, assertExists } from "@std/assert";
import { spy } from "@std/testing/mock";
import { SearchState } from "../src/mod.ts";
import { getSearchState, pingAndGetMeiliSearch } from "./util.ts";
import { createPokemon } from "./models/pokemon.ts";

Deno.test(`Test ${SearchState.name}`, async (t) => {
  const client = await pingAndGetMeiliSearch();
  const INDEX = `${SearchState.name}-test`;
  await using _ = await createPokemon(client, INDEX);
  using searchState = getSearchState(client);

  await t.step(
    "should only call `fetch` once, after synchronous tasks finished running",
    async () => {
      using fetchSpy = spy(
        globalThis,
        "fetch",
      );

      const arrOfQ = ["once", "twice", "thrice", "four times"];
      for (const q of arrOfQ) {
        searchState.value.changeQuery(
          null,
          INDEX,
          (query) => void (query.q = q),
        );
      }

      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));

      assertEquals(fetchSpy.calls.length, 1);

      const body = fetchSpy.calls[0]!.args[1]?.body;
      assertExists(body);

      assertEquals(
        body,
        JSON.stringify({ queries: [{ indexUid: INDEX, q: arrOfQ.at(-1) }] }),
      );
    },
  );

  await t.step(
    "should abort previous unfinished running `fetch` calls",
    async () => {
      using fetchSpy = spy(
        globalThis,
        "fetch",
      );

      searchState.value.changeQuery(
        null,
        INDEX,
        (query) => void (query.q = "TEST"),
      );
      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));
      searchState.value.changeQuery(
        null,
        INDEX,
        (query) => void (query.q = "TEST TEST"),
      );
      // TODO: This might not be the best way to advance the task queue
      await new Promise((resovle) => setTimeout(resovle));

      assertEquals(fetchSpy.calls.length, 2);
      const [first, second] = await Promise.allSettled(
        fetchSpy.calls.map((v) => v.returned),
      );

      assertEquals(first, { status: "rejected", reason: {} });
      assertEquals(second?.status, "fulfilled");
    },
  );
});
