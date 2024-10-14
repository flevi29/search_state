import { writable, derived, readonly } from "svelte/store";
import { MeiliSearch, MeiliSearchApiError, type IndexStats } from "meilisearch";
import { SearchState } from "$rootSrc/mod";

const STATUS = Object.freeze({
  OK: 0,
  INVALID_API_KEY: 1,
  UNKNOWN_ERROR: 2,
});

type StatusType = typeof STATUS;

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    const msg = String(error);
    return error.cause == null
      ? msg
      : `${msg}\ncaused by ${getErrorMessage(error.cause)}`;
  }

  return JSON.stringify(error, null, 2);
}

const LS_HOST_KEY = "0",
  LS_API_KEY_KEY = "1",
  LS_INDEX_KEY = "2";

const searchState = (() => {
  const hostAndApiKey = writable<[host: string | null, apiKey: string | null]>([
    localStorage.getItem(LS_HOST_KEY) || null,
    localStorage.getItem(LS_API_KEY_KEY) || null,
  ]);

  let rawSearchState = $state<SearchState | null>(null),
    indexes = $state<Record<string, IndexStats> | null>(null),
    // TODO: when this changes many setting should reset
    selectedIndex = $state<string | null>(
      localStorage.getItem(LS_INDEX_KEY) || null,
    );

  const searchState = derived<
      typeof hostAndApiKey,
      | { status: StatusType["OK"]; value: SearchState }
      | {
          status: StatusType["INVALID_API_KEY" | "UNKNOWN_ERROR"];
          value: string;
        }
      | null
    >(
      hostAndApiKey,
      ([host, apiKey], set) => {
        if (host === null || apiKey === null) {
          rawSearchState = null;
          indexes = null;
          selectedIndex = null;
          return set(null);
        }

        try {
          const meilisearch = new MeiliSearch({ host, apiKey });

          const promise = meilisearch
            .getRawIndexes({ limit: 50 })
            .then(({ results }) =>
              Promise.all(
                results.map(({ uid }) =>
                  meilisearch
                    .index(uid)
                    .getStats()
                    .then((stats) => ({ uid, stats })),
                ),
              ),
            )
            .then((indexesWithStats) => {
              // TODO: errorCallback second argument
              const st = new SearchState(meilisearch);
              st.start();
              set({ status: STATUS.OK, value: st });
              rawSearchState = st;
              // TODO: What if there are not indexes? What will the value be?
              indexes = indexesWithStats.reduce(
                (previousValue, { uid, stats }) => {
                  previousValue[uid] = stats;
                  return previousValue;
                },
                {} as Record<string, IndexStats>,
              );

              if (selectedIndex === null) {
                selectedIndex = indexesWithStats[0]?.uid ?? null;
              }

              return st.stop;
            })
            .catch((error: unknown) => {
              set({
                status:
                  error instanceof MeiliSearchApiError &&
                  // https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key
                  error.cause?.code === "invalid_api_key"
                    ? STATUS.INVALID_API_KEY
                    : STATUS.UNKNOWN_ERROR,
                value: getErrorMessage(error),
              });
              rawSearchState = null;
              indexes = null;
              selectedIndex = null;
            });

          // stop previous `SearchState`
          return () => {
            promise.then((v) => v?.()).catch(console.error);
          };
        } catch (error) {
          set({
            status: STATUS.UNKNOWN_ERROR,
            value: getErrorMessage(error),
          });
          rawSearchState = null;
          indexes = null;
          selectedIndex = null;
        }
      },
      null,
    ),
    isHostAndApiKeySet = derived(
      hostAndApiKey,
      ([host, apiKey]) => host !== null && apiKey !== null,
    );

  return {
    hostAndApiKey: readonly(hostAndApiKey),
    setHostAndApiKey(host: string, apiKey: string): void {
      hostAndApiKey.set([host || null, apiKey || null]);
      localStorage.setItem(LS_HOST_KEY, host);
      localStorage.setItem(LS_API_KEY_KEY, apiKey);
    },
    isHostAndApiKeySet,
    value: searchState,
    get rawValue() {
      return rawSearchState;
    },
    get indexes() {
      return indexes;
    },
    get selectedIndex() {
      return selectedIndex;
    },
    setSelectedIndex(v: string): void {
      if (indexes === null || !(v in indexes)) {
        throw new Error(
          `either indexes are not set or provided key "${v}" cannot be found in indexes`,
        );
      }

      selectedIndex = v;
      localStorage.setItem(LS_INDEX_KEY, v);
    },
  };
})();

export { searchState, STATUS };
