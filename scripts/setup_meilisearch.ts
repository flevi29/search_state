import { pingAndGetMeiliSearch } from "../utils/meili_getters.ts";
import { type BaseDocument, MOVIES } from "../models/index.ts";

const INDEX = "i";

const meilisearch = await pingAndGetMeiliSearch();

await meilisearch.deleteIndexIfExists(INDEX);

const index = meilisearch.index<BaseDocument>(INDEX);
await meilisearch.waitForTask((await index.addDocuments(MOVIES)).taskUid);

await meilisearch.waitForTask(
  (
    await index.updateSettings({ sortableAttributes: ["score", "title"] })
  ).taskUid,
);
