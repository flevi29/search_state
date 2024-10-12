// - should store data about current state
// - should support adding widgets
import type {
  MeiliSearch,
  MultiSearchResponse,
  MultiSearchQuery,
} from "meilisearch";

type ErrorCallback = (source: unknown, error: unknown) => void;

type SearchQueryMap = Map<string, MultiSearchQuery>;

type QueryMapListener = (initiator: unknown, queryMap: SearchQueryMap) => void;
type ResponseListener = (response: MultiSearchResponse) => void;

// @TODO: Each widget should have a static ID + indexUid stored in state, this will tell the widgets
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
    errorCallback: ErrorCallback = (_initiator, error) => console.error(error)
  ) {
    this.#meilisearch = meilisearch;
    this.#errorCallback = errorCallback;
  }

  // @TODO: How needed is this thing actually? Outside of the potential router,
  //        only rarely do widgets mess with eachoters properties.
  //        It is needed but not in the way we're using it now. It's needed for when
  //        widgets might mess with eachothers params, something that is rare, in particular for
  //        pagination any change that's not from within will need to reset it.
  //        For facets, current refinements will be able to mess with it. And probably more similar cases.
  //        So it is needed, albeit rarely.
  //        !! Router will work directly with the widgets !!
  //        Instead we should have particular listeners, one for resetting pagination, one for resetting/removing some facets, etc.,
  //        and the widgets that should react to these events will listen to them.
  #queryMapListeners = new Set<QueryMapListener>();
  addQueryMapListener(listener: QueryMapListener) {
    this.#queryMapListeners.add(listener);
    return () => this.#queryMapListeners.delete(listener);
  }

  #responseListeners = new Set<ResponseListener>();
  addResponseListener(listener: ResponseListener) {
    this.#responseListeners.add(listener);
    return () => this.#responseListeners.delete(listener);
  }

  #currentCallback: (() => Promise<void>) | null = null;
  #countScheduled = 0;
  #promiseChain = Promise.resolve();
  #search() {
    if (this.#queryState.size === 0) {
      return Promise.resolve();
    }

    const responseListeners = Array.from(this.#responseListeners),
      queries = Array.from(this.#queryState.values());

    const localCallback = async () => {
      const response = await this.#meilisearch.multiSearch({ queries });

      // @TODO: Call only the ones where the indexUid matches
      for (const listener of responseListeners) {
        listener(response);
      }
    };
    this.#currentCallback = localCallback;

    const isFirstBeforeExecution = this.#countScheduled === 0;

    // this is done so that when a search is pending, only the last scheduled search may run
    this.#countScheduled += 1;
    return (this.#promiseChain = this.#promiseChain.then(async () => {
      try {
        if (isFirstBeforeExecution) {
          await localCallback();
          return;
        }

        // is second at the time of execution
        if (this.#countScheduled === 1) {
          await this.#currentCallback!();
        }
      } finally {
        this.#countScheduled -= 1;
      }
    }));
  }

  #queryState: SearchQueryMap = new Map();
  changeQuery(
    initiator: unknown,
    indexUid: string,
    indexQueryCallback: (indexQuery: MultiSearchQuery) => void
  ) {
    let indexQuery = this.#queryState.get(indexUid);
    if (indexQuery === undefined) {
      indexQuery = { indexUid };
      this.#queryState.set(indexUid, indexQuery);
    }

    indexQueryCallback(indexQuery);

    // @TODO: Check whether indexQuery still has any keys, as widget unmount functions delete keys
    //        In case it does not have any more keys, we should delete the entry on the map and not call any more listeners

    // TODO: Call only the ones that match the index, so they don't all have to separately call get? How would this
    //       influence the router? According to above description we need a little
    //       more work on this, as different maps and listeners will have to be addressed.
    for (const listener of this.#queryMapListeners) {
      listener(initiator, this.#queryState);
    }

    if (this.#isStarted) {
      this.#search().catch((error) => this.#errorCallback(initiator, error));
    }
  }

  readonly start = (): void => {
    if (!this.#isStarted) {
      this.#isStarted = true;
      this.#search().catch((error) => this.#errorCallback(null, error));
    }
  };

  readonly stop = (): void => {
    this.#isStarted = false;
  };
}
