import type { MeiliSearch } from "meilisearch";

export async function createDocuments(
  client: MeiliSearch,
  indexUid: string,
  documents: Record<string, unknown>[],
): Promise<() => Promise<void>> {
  const { taskUid } = await client.index(indexUid).addDocuments(documents);
  const { status, error } = await client.waitForTask(taskUid);

  if (status !== "succeeded") {
    throw error;
  }

  return async () => {
    const { taskUid } = await client.deleteIndex(indexUid);
    const { status, error } = await client.waitForTask(taskUid);

    if (status !== "succeeded") {
      throw error;
    }
  };
}
