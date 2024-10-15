import type {
  MeiliSearch,
  MultiSearchQuery,
  MultiSearchResult,
} from "meilisearch";

type ErrorCallback = (source: unknown, error: unknown) => void;

type SearchQueryMap = Map<string, MultiSearchQuery>;

type QueryListener = (query: MultiSearchQuery) => void;
type ResponseListener = (response: MultiSearchResult<unknown>) => void;

// TODO: Each widget should have a static ID + indexUid stored in state, this will tell the widgets
//        whether there's already a widget of the same type on the same indexUid in state, so they can err

export class SearchState {
  #isStarted = false;

  readonly #meilisearch: MeiliSearch;
  readonly #errorCallback: ErrorCallback;
  get errorCallback() {
    return this.#errorCallback;
  }

  constructor(
    meilisearch: MeiliSearch,
    errorCallback: ErrorCallback = (_, error) => console.error(error),
  ) {
    this.#meilisearch = meilisearch;
    this.#errorCallback = errorCallback;
  }

  #responseListeners = new Map<string, ResponseListener>();
  addResponseListener(
    indexUid: string,
    listener: ResponseListener,
  ): () => void {
    this.#responseListeners.set(indexUid, listener);
    return () => void this.#responseListeners.delete(indexUid);
  }

  #to: ReturnType<typeof setTimeout> | null = null;
  #ac: AbortController = new AbortController();
  readonly #abortObject = {};
  #scheduledPromises = 0;
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

        this.#scheduledPromises += 1;

        if (this.#scheduledPromises > 1) {
          this.#ac.abort(this.#abortObject);
          this.#ac = new AbortController();
        }

        const { results } = await this.#meilisearch.multiSearch(
          { queries: Array.from(this.#queryState.values()) },
          { signal: this.#ac.signal },
        );

        const resultsMap = new Map<string, MultiSearchResult<unknown>>();
        for (const result of results) {
          resultsMap.set(result.indexUid, result);
        }

        for (const [indexUid, listener] of this.#responseListeners) {
          const result = resultsMap.get(indexUid);
          if (result === undefined) {
            this.#errorCallback(
              this,
              new Error(
                `listener for indexUid "${indexUid}" did not recieve a result from search request`,
              ),
            );
            continue;
          }

          listener(result);
        }
      })()
        .catch((error) => {
          if (
            !(error instanceof Error) ||
            !Object.is(error.cause, this.#abortObject)
          ) {
            this.#errorCallback(initiator, error);
          }
        })
        .finally(() => {
          this.#scheduledPromises -= 1;
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

  #resetPaginationListeners = new Map<string, QueryListener>();
  addResetPaginationListener(
    indexUid: string,
    listener: QueryListener,
  ): () => void {
    this.#resetPaginationListeners.set(indexUid, listener);
    return () => void this.#resetPaginationListeners.delete(indexUid);
  }

  readonly changeQueryAndResetPagination: this["changeQuery"] = (
    initiator,
    indexUid,
    indexQueryCallback,
  ) => {
    const query = this.#getMultiSearchQuery(indexUid);

    for (const [uid, listener] of this.#resetPaginationListeners) {
      if (uid === indexUid) {
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
