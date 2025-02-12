import type {
  MeiliSearch,
  MultiSearchQuery,
  MultiSearchResult,
} from "meilisearch";
import { addListener } from "./util.ts";

type ErrorCallback = (source: unknown, error: unknown) => void;

type SearchQueryMap = Map<string, MultiSearchQuery>;

// type FilterListener = (filter?: string) => void;
type QueryListener = (query: MultiSearchQuery) => void;
type ResponseListener = (response: MultiSearchResult<unknown>) => void;

// TODO: Each widget should have a static ID + indexUid stored in state, this will tell the widgets
//        whether there's already a widget of the same type on the same indexUid in state, so they can err

export class SearchState {
  #isStarted = false;

  readonly #meilisearch: MeiliSearch;
  readonly #errorCallback: ErrorCallback;
  get errorCallback(): ErrorCallback {
    return this.#errorCallback;
  }

  constructor(
    meilisearch: MeiliSearch,
    errorCallback: ErrorCallback = (_, error) => console.error(error),
  ) {
    this.#meilisearch = meilisearch;
    this.#errorCallback = errorCallback;
  }

  #responseListeners = new Map<string, Set<ResponseListener>>();
  addResponseListener(
    indexUid: string,
    listener: ResponseListener,
  ): () => void {
    return addListener(this.#responseListeners, indexUid, listener);
  }

  #to: ReturnType<typeof setTimeout> | null = null;
  #ac: AbortController = new AbortController();
  readonly #abortObject = {};
  #numOfPromises = 0;
  readonly #search = (initiator: unknown): void => {
    if (!this.#isStarted) {
      return;
    }

    if (this.#to !== null) {
      clearTimeout(this.#to);
    }

    this.#to = setTimeout(() =>
      (async () => {
        if (this.#queryState.size === 0) {
          return;
        }

        this.#numOfPromises += 1;

        if (this.#numOfPromises > 1) {
          this.#ac.abort(this.#abortObject);
          this.#ac = new AbortController();
        }

        const { results } = await this.#meilisearch.multiSearch(
          { queries: Array.from(this.#queryState.values()) },
          { signal: this.#ac.signal },
        );

        for (const [indexUid, responseListeners] of this.#responseListeners) {
          const result = results.find((v) => v.indexUid === indexUid);
          if (result === undefined) {
            this.#errorCallback(
              this,
              new Error(
                `listeners for indexUid "${indexUid}" did not receive a result from search request`,
              ),
            );
            continue;
          }

          for (const listener of responseListeners) {
            listener(result);
          }
        }
      })()
        .catch((error) => {
          if (
            error === null ||
            typeof error !== "object" ||
            !Object.is(error.cause, this.#abortObject)
          ) {
            this.#errorCallback(initiator, error);
          }
        })
        .finally(() => {
          this.#numOfPromises -= 1;
        })
    );
  };

  #queryState: SearchQueryMap = new Map();
  #getMultiSearchQuery(indexUid: string): MultiSearchQuery {
    let indexQuery = this.#queryState.get(indexUid);
    if (indexQuery === undefined) {
      indexQuery = { indexUid };
      this.#queryState.set(indexUid, indexQuery);
    }

    return indexQuery;
  }

  // #filterListeners = new Map<string, Set<FilterListener>>();
  // addFilterListener(indexUid: string, listener: FilterListener): () => void {
  //   return addListener(this.#filterListeners, indexUid, listener);
  // }

  // #filterCache = new Map<string, string>();
  // // TODO: Rename this
  // #handleFilters({ indexUid, filter }: MultiSearchQuery) {
  //   if (Array.isArray(filter)) {
  //     this.#errorCallback(this, new Error("array filters are unsupported"));
  //     return;
  //   }

  //   const cachedFilter = this.#filterCache.get(indexUid);
  //   if (filter !== cachedFilter) {
  //     filter !== undefined
  //       ? this.#filterCache.set(indexUid, filter)
  //       : this.#filterCache.delete(indexUid);

  //     const indexFilterListeners = this.#filterListeners.get(indexUid);
  //     if (indexFilterListeners !== undefined) {
  //       for (const listener of indexFilterListeners) {
  //         listener(filter);
  //       }
  //     }
  //   }
  // }

  #changeQuery(
    initiator: unknown,
    indexQuery: MultiSearchQuery,
    indexQueryCallback: (query: MultiSearchQuery) => void,
  ): void {
    indexQueryCallback(indexQuery);

    if (Object.keys(indexQuery).length === 1) {
      this.#queryState.delete(indexQuery.indexUid);
      return;
    }

    // this.#handleFilters(indexQuery);

    this.#search(initiator);
  }

  readonly changeQuery = (
    initiator: unknown,
    indexUid: string,
    indexQueryCallback: (query: MultiSearchQuery) => void,
  ): void => {
    this.#changeQuery(
      initiator,
      this.#getMultiSearchQuery(indexUid),
      indexQueryCallback,
    );
  };

  #resetPaginationListeners = new Map<string, Set<QueryListener>>();
  addResetPaginationListener(
    indexUid: string,
    listener: QueryListener,
  ): () => void {
    return addListener(this.#resetPaginationListeners, indexUid, listener);
  }

  readonly resetPaginationAndChangeQuery: this["changeQuery"] = (
    initiator,
    indexUid,
    indexQueryCallback,
  ) => {
    const query = this.#getMultiSearchQuery(indexUid);

    const indexResetPaginationListeners = this.#resetPaginationListeners.get(
      indexUid,
    );
    if (indexResetPaginationListeners !== undefined) {
      for (const listener of indexResetPaginationListeners) {
        listener(query);
      }
    }

    this.#changeQuery(initiator, query, indexQueryCallback);
  };

  readonly start = (): void => {
    if (!this.#isStarted) {
      this.#isStarted = true;
      this.#search(this);
    }
  };

  readonly stop = (): void => {
    this.#isStarted = false;
  };
}
