import { pingAndGetMeiliSearch } from "../utils/meili_getters.ts";
import { type Movie, MOVIES } from "../models/index.ts";

const INDEX = "i";

const meilisearch = await pingAndGetMeiliSearch();

await meilisearch.deleteIndexIfExists(INDEX);

const index = meilisearch.index<Movie>(INDEX);
const task1 = await index.addDocuments(MOVIES);
await meilisearch.waitForTask(task1.taskUid);

const task2 = await index.updateSettings({
  sortableAttributes: ["score", "title"],
});
await meilisearch.waitForTask(task2.taskUid);

console.log(`Added ${MOVIES.length} documents to index "${INDEX}"`);
console.log("%cSUCCESS!", "color: green");
