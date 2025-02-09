import { MeiliSearch } from "meilisearch";
import { type Movie, MOVIES } from "./models/index.ts";

const INDEX = "movies";

const meilisearch = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});

await meilisearch.deleteIndexIfExists(INDEX);
const index = meilisearch.index<Movie>(INDEX);

await meilisearch.waitForTask(
  (
    await index.updateSettings({
      sortableAttributes: ["title", "release_date", "popularity"],
      filterableAttributes: ["genres", "language"],
    })
  ).taskUid,
);

await meilisearch.waitForTask((await index.addDocuments(MOVIES)).taskUid);
