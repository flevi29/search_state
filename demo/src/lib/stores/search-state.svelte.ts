import { MeiliSearch, MeiliSearchApiError } from "meilisearch";
import { SearchState } from "$rootSrc/mod";

const INDEX_UID = "i";

const STATUS = Object.freeze({
  OK: 0,
  INVALID_API_KEY: 1,
  UNKNOWN_ERROR: 2,
});

type StatusType = typeof STATUS;

function getSearchState(initialHost: string, initialApiKey: string) {
  let host = $state<string>(initialHost),
    apiKey = $state<string>(initialApiKey),
    searchState = $state<
      | { status: StatusType["OK"]; value: SearchState }
      | { status: StatusType["INVALID_API_KEY"]; value: MeiliSearchApiError }
      | { status: StatusType["UNKNOWN_ERROR"]; value: string }
      | null
    >(null);

  $effect(() => {
    try {
      const meilisearch = new MeiliSearch({ host, apiKey });

      // TODO: This does not trigger api error perhaps?
      const promise = meilisearch
        .health()
        .then(({ status }) => {
          if (status === "available") {
            const st = new SearchState(meilisearch);
            st.start();
            searchState = { status: STATUS.OK, value: st };

            return st.stop;
          }

          searchState = {
            status: STATUS.UNKNOWN_ERROR,
            value: "Meilisearch could be reached, but it is unavailable",
          };
        })
        .catch((error: unknown) => {
          searchState =
            error instanceof MeiliSearchApiError &&
            // https://www.meilisearch.com/docs/reference/errors/error_codes#invalid_api_key
            error.cause?.code === "invalid_api_key"
              ? { status: STATUS.INVALID_API_KEY, value: error }
              : // TODO: error message
                { status: STATUS.UNKNOWN_ERROR, value: "" };
        });

      // stop previous `SearchState`
      return () => {
        promise.then((v) => v?.()).catch(console.error);
      };
    } catch (error) {
      // TODO: error message
      searchState = { status: STATUS.UNKNOWN_ERROR, value: "" };
    }
  });

  return {
    setHost(v: string): void {
      host = v;
    },
    setApiKey(v: string): void {
      apiKey = v;
    },
    get searchState() {
      return searchState;
    },
  };
}

export { INDEX_UID, getSearchState, STATUS };
