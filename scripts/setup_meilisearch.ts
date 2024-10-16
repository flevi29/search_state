import { MeiliSearch } from "meilisearch";

const INDEX = "i";

const meilisearch = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});

await meilisearch.deleteIndexIfExists(INDEX);
const index = meilisearch.index<{
  id: number;
  title: string;
  genres: string[];
  score: number;
}>(INDEX);
await meilisearch.waitForTask(
  (
    await index.addDocuments([
      { id: 1, title: "Carol", genres: ["Romance", "Drama"], score: 100 },
      {
        id: 2,
        title: "Wonder Woman",
        genres: ["Action", "Adventure"],
        score: 200,
      },
      {
        id: 3,
        title: "Life of Pi",
        genres: ["Adventure", "Drama"],
        score: 400,
      },
      {
        id: 4,
        title: "Mad Max: Fury Road",
        genres: ["Adventure", "Science Fiction"],
        score: 50,
      },
      { id: 5, title: "Moana", genres: ["Fantasy", "Action"], score: 60 },
      { id: 6, title: "Philadelphia", genres: ["Drama"], score: 1000 },
    ])
  ).taskUid
);

await meilisearch.waitForTask(
  (
    await index.updateSettings({ sortableAttributes: ["score", "title"] })
  ).taskUid
);
