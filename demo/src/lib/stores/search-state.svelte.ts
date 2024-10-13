import { writable, derived, readonly } from "svelte/store";
import {
  MeiliSearch,
  MeiliSearchApiError,
  type IndexObject,
} from "meilisearch";
import { SearchState } from "$rootSrc/mod";

const INDEX_UID = "i";

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
  LS_API_KEY_KEY = "1";

const searchState = (() => {
  const hostAndApiKey = writable<[host: string | null, apiKey: string | null]>([
    localStorage.getItem(LS_HOST_KEY) || null,
    localStorage.getItem(LS_API_KEY_KEY) || null,
  ]);

  let rawSearchState = $state<SearchState | null>(null),
    // TODO: Query all indexes for more details
    rawIndexes = $state<IndexObject[] | null>(null);

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
          rawIndexes = null;
          return set(null);
        }

        try {
          const meilisearch = new MeiliSearch({ host, apiKey });

          const promise = meilisearch
            .getRawIndexes({ limit: 50 })
            .then(({ results }) => {
              const st = new SearchState(meilisearch);
              st.start();
              set({ status: STATUS.OK, value: st });
              rawSearchState = st;

              rawIndexes = results;

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
              rawIndexes = null;
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
          rawIndexes = null;
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
    get rawIndexes() {
      return rawIndexes;
    },
  };
})();

export { INDEX_UID, searchState, STATUS };
