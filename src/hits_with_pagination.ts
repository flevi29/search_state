import type { MultiSearchQuery, MultiSearchResult } from "meilisearch";
import type { SearchState } from "./search_state.ts";
import { getState } from "./util.ts";

// type PaginationConnectorParams = {
//   /**
//    * The total number of pages to browse.
//    */
//   totalPages?: number;
//   /**
//    * The padding of pages to show around the current page
//    * @default 3
//    */
//   padding?: number;
// };
// export type PaginationRenderState = {
//   /** Creates URLs for the next state, the number is the page to generate the URL for. */
//   createURL: CreateURL<number>;
//   /** Sets the current page and triggers a search. */
//   refine: (page: number) => void;
//   /** true if this search returned more than one page */
//   canRefine: boolean;
//   /** The number of the page currently displayed. */
//   currentRefinement: number;
//   /** The number of hits computed for the last query (can be approximated). */
//   nbHits: number;
//   /** The number of pages for the result set. */
//   nbPages: number;
//   /** The actual pages relevant to the current situation and padding. */
//   pages: number[];
//   /** true if the current page is also the first page. */
//   isFirstPage: boolean;
//   /** true if the current page is also the last page. */
//   isLastPage: boolean;
// };

// How do I implement a widget for these attributes?
// I want them to be settable and listenable, which means it'll be possible to set them from the router.

type AttributesToRetrieve = NonNullable<
  MultiSearchQuery["attributesToRetrieve"]
>;
//
type AttributesToCrop = NonNullable<MultiSearchQuery["attributesToCrop"]>;
type CropLength = NonNullable<MultiSearchQuery["cropLength"]>;
type CropMarker = NonNullable<MultiSearchQuery["cropMarker"]>;
//
type AttributesToHighlight = NonNullable<
  MultiSearchQuery["attributesToHighlight"]
>;
type HighlightPreTag = NonNullable<MultiSearchQuery["highlightPreTag"]>;
type HighlightPostTag = NonNullable<MultiSearchQuery["highlightPostTag"]>;
//
type ShowMatchesPosition = NonNullable<MultiSearchQuery["showMatchesPosition"]>;
//
type ShowRankingScore = NonNullable<MultiSearchQuery["showRankingScore"]>;
//
type ShowRankingScoreDetails = NonNullable<
  MultiSearchQuery["showRankingScoreDetails"]
>;

type Hits<T extends Record<string, any>> = MultiSearchResult<T>["hits"];
type EstimatedTotalHits = NonNullable<
  MultiSearchResult<never>["estimatedTotalHits"]
>;
type Limit = NonNullable<MultiSearchQuery["limit"]>;
type Offset = NonNullable<MultiSearchQuery["offset"]>;

type HitsWithPaginationOptions<T extends Record<string, any>> = {
  initialLimit: number;
  hitsListener: (hits: Hits<T>) => void;
  estimatedTotalHitsListener: (estimatedTotalHits: EstimatedTotalHits) => void;
  limitListener: (limit: number) => void;
  pageListener: (page: number) => void;
  hasPreviousListener: (hasPrevious: boolean) => void;
  hasNextListener: (hasNext: boolean) => void;
};

// Saving last hit:
// - if offset is 0, limit will be +1 and it will be added to offset for next page;
//   otherwise limit will be as is and offset will accumulate it as is
// - always save last hit and, unless offset is 0, append to current hits array
// - if offset and limit is set to an arbitrary "page", need to consider how to handle saved last hit
//   - this means I have to keep track for last hit the next limit and offset combination it requires to be valid
//   - if no last hit is available for an arbitrary page, then what? if we go back then what?
//     - then we'd need to handle limit and offset differently etc.
// It just seems too much headache, maybe will implement one day

function isOffsetLimitCorrect(offset: number, limit: number): boolean {
  return limit > 1 && offset % (limit - 1) === 0;
}

export class HitsWithPagination<T extends Record<string, any>> {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #removeResetPaginationListener: () => void;
  readonly #removeResponseListener: () => void;

  readonly #limitListener: HitsWithPaginationOptions<T>["limitListener"];
  readonly #pageListener: HitsWithPaginationOptions<T>["pageListener"];
  readonly #hasPreviousListener: HitsWithPaginationOptions<
    T
  >["hasPreviousListener"];
  readonly #hasNextListener: HitsWithPaginationOptions<T>["hasNextListener"];

  #estimatedTotalHits?: EstimatedTotalHits;
  #limit: Limit;
  #offset: Offset;

  #page: number;
  #hasPrevious?: boolean;
  #hasNext?: boolean;

  #setHasPreviousAndCallListener() {
    if (this.#offset === 0) {
      if (this.#hasPrevious !== false) {
        this.#hasPrevious = false;
        this.#hasPreviousListener(false);
      }
    } else if (this.#hasPrevious !== true) {
      this.#hasPrevious = true;
      this.#hasPreviousListener(true);
    }
  }

  constructor(
    state: SearchState,
    indexUid: string,
    {
      initialLimit,
      hitsListener,
      estimatedTotalHitsListener,
      limitListener,
      pageListener,
      hasPreviousListener,
      hasNextListener,
    }: HitsWithPaginationOptions<T>,
  ) {
    const initialLimitPlusOne = initialLimit + 1;

    this.#removeResetPaginationListener = state.addResetPaginationListener(
      indexUid,
      (query) => {
        // TODO: Maybe over-complicated, simplify
        let { limit, offset } = query;

        if (offset === undefined) {
          query.offset = offset = 0;
        }

        if (limit === undefined) {
          query.limit = limit = initialLimitPlusOne;
        }

        let isLimitOrOffsetChanged = false;

        if (limit !== this.#limit) {
          this.#limit = limit;
          isLimitOrOffsetChanged = true;
          limitListener(limit);
        }

        if (offset !== this.#offset) {
          this.#offset = offset;
          isLimitOrOffsetChanged = true;

          this.#setHasPreviousAndCallListener();
        }

        if (isLimitOrOffsetChanged) {
          const page = this.#offset / (this.#limit - 1);

          if (page !== this.#page) {
            this.#page = page;
            pageListener(page + 1);
          }
        }
      },
    );

    this.#removeResponseListener = state.addResponseListener(({ results }) => {
      for (const result of results) {
        if (result.indexUid === indexUid) {
          const { hits, estimatedTotalHits, limit, offset } = result;

          if (
            estimatedTotalHits === undefined ||
            limit === undefined ||
            offset === undefined
          ) {
            state.errorCallback(
              this,
              new Error(
                "one or more of `estimatedTotalHits`, `limit`, `offset` is undefined",
              ),
            );
            return;
          }

          if (!isOffsetLimitCorrect(offset, limit)) {
            state.errorCallback(
              this,
              new Error(
                `bad offset and/or limit values (${
                  JSON.stringify({
                    limit,
                    offset,
                  })
                })`,
              ),
            );
            return;
          }

          if (estimatedTotalHits !== this.#estimatedTotalHits) {
            this.#estimatedTotalHits = estimatedTotalHits;
            estimatedTotalHitsListener(estimatedTotalHits);
          }

          let isLimitOrOffsetChanged = false;

          if (limit !== this.#limit) {
            this.#limit = limit;
            isLimitOrOffsetChanged = true;
            limitListener(limit);
          }

          if (offset !== this.#offset) {
            this.#offset = offset;
            isLimitOrOffsetChanged = true;

            this.#setHasPreviousAndCallListener();
          }

          if (isLimitOrOffsetChanged) {
            const page = this.#offset / (this.#limit - 1);

            if (page !== this.#page) {
              this.#page = page;
              pageListener(page + 1);
            }
          }

          if (hits.length === limit) {
            hitsListener(<Hits<T>> hits.slice(0, limit - 1));

            if (this.#hasNext !== true) {
              this.#hasNext = true;
              hasNextListener(true);
            }
          } else {
            hitsListener(<Hits<T>> hits);

            if (this.#hasNext !== false) {
              this.#hasNext = false;
              hasNextListener(false);
            }
          }

          return;
        }
      }

      state.errorCallback(
        this,
        new Error(`no response returned for index \`${indexUid}\``),
      );
    });

    this.#state = state;
    this.#indexUid = indexUid;

    this.#limitListener = limitListener;
    this.#pageListener = pageListener;
    this.#hasPreviousListener = hasPreviousListener;
    this.#hasNextListener = hasNextListener;

    this.#limit = initialLimitPlusOne;
    this.#offset = 0;
    this.#page = 0;
    state.changeQuery(this, indexUid, (indexQuery) => {
      indexQuery.limit = initialLimitPlusOne;
      indexQuery.offset = 0;
      limitListener(initialLimit);
      pageListener(1);
    });
  }

  readonly setLimit = (limit: Limit): void => {
    const state = getState(this.#state);

    const limitPlusOne = limit + 1;

    if (limitPlusOne !== this.#limit) {
      this.#limit = limitPlusOne;
      this.#limitListener(limitPlusOne - 1);

      if (this.#page !== 0) {
        this.#page = 0;
        this.#pageListener(1);
      }
      this.#setHasPreviousAndCallListener();
      // only the response can determine whether there is a next page, so make it false
      this.#hasNext = false;
      this.#hasNextListener(false);

      state.changeQuery(this, this.#indexUid, (query) => {
        query.limit = limitPlusOne;
        query.offset = 0;
      });
    }
  };

  readonly previousPage = (): void => {
    const state = getState(this.#state);

    if (!this.#hasPrevious) {
      throw new Error("no previous page");
    }

    this.#page -= 1;
    this.#offset = this.#page * (this.#limit - 1);

    this.#pageListener(this.#page + 1);
    this.#setHasPreviousAndCallListener();

    state.changeQuery(
      this,
      this.#indexUid,
      (query) => void (query.offset = this.#offset),
    );
  };

  readonly nextPage = (): void => {
    const state = getState(this.#state);

    if (!this.#hasNext) {
      throw new Error("no next page, or have to await response first");
    }

    this.#page += 1;
    this.#offset = this.#page * (this.#limit - 1);

    this.#pageListener(this.#page + 1);
    this.#setHasPreviousAndCallListener();
    // only the response can determine whether there is a next page, so make it false
    this.#hasNext = false;
    this.#hasNextListener(false);

    state.changeQuery(
      this,
      this.#indexUid,
      (query) => void (query.offset = this.#offset),
    );
  };

  readonly unmount = (): void => {
    const state = getState(this.#state);

    this.#removeResetPaginationListener();
    this.#removeResponseListener();

    state.changeQuery(this, this.#indexUid, (query) => {
      delete query.offset;
      delete query.limit;
    });

    this.#state = undefined;
  };
}
