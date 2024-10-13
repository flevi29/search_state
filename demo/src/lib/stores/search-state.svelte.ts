import { writable, derived } from "svelte/store";
import { MeiliSearch, MeiliSearchApiError } from "meilisearch";
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

const searchState = (() => {
  // TODO: localstorage
  const host = writable<string | null>(null),
    apiKey = writable<string | null>(null);

  let rawSearchState = $state<SearchState | null>(null);
  const searchState = derived<
    [typeof host, typeof apiKey],
    | { status: StatusType["OK"]; value: SearchState }
    | {
        status: StatusType["INVALID_API_KEY" | "UNKNOWN_ERROR"];
        value: string;
      }
    | null
  >(
    [host, apiKey],
    ([host, apiKey], set) => {
      if (host === null || apiKey === null) {
        return set(null);
      }

      try {
        const meilisearch = new MeiliSearch({ host, apiKey });

        // TODO: This does not trigger api error perhaps?
        const promise = meilisearch
          .getRawIndexes({ limit: 50 })
          .then(() => {
            // TODO: Set indexes state
            const st = new SearchState(meilisearch);
            st.start();
            set({ status: STATUS.OK, value: st });
            rawSearchState = st;

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
      }
    },
    null,
  );

  return {
    setHost: host.set,
    setApiKey: apiKey.set,
    value: searchState,
    get rawValue() {
      return rawSearchState;
    },
  };
})();

export { INDEX_UID, searchState, STATUS };
