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

type HitsPerPage = NonNullable<MultiSearchQuery["hitsPerPage"]>;
type Page = NonNullable<MultiSearchQuery["page"]>;
type Hits<T extends Record<string, any>> = MultiSearchResult<T>["hits"];
type TotalHits = NonNullable<MultiSearchResult<never>["totalHits"]>;
type TotalPages = NonNullable<MultiSearchResult<never>["totalPages"]>;

type HitsWithNumberedPaginationOptions<T extends Record<string, any>> = {
  initialHitsPerPage: HitsPerPage;
  hitsPerPageListener: (hitsPerPage: HitsPerPage) => void;
  hitsListener: (hits: Hits<T>) => void;
  totalHitsListener: (totalHits: TotalHits) => void;
  totalPagesListener: (totalPages: TotalPages) => void;
  pageListener: (page: Page) => void;
};

const PAGE_ONE = 1;

export class HitsWithNumberedPagination<
  T extends Record<string, any> = Record<string, any>
> {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #removeParamsMapListener: () => void;
  readonly #removeResponseListener: () => void;

  readonly #hitsPerPageListener: HitsWithNumberedPaginationOptions<T>["hitsPerPageListener"];
  readonly #pageListener: HitsWithNumberedPaginationOptions<T>["pageListener"];

  #hitsPerPage: HitsPerPage;
  #page: Page;
  #totalHits?: TotalHits;
  #totalPages?: TotalPages;

  constructor(
    state: SearchState,
    indexUid: string,
    {
      initialHitsPerPage,
      hitsPerPageListener,
      hitsListener,
      totalHitsListener,
      totalPagesListener,
      pageListener,
    }: HitsWithNumberedPaginationOptions<T>
  ) {
    this.#removeParamsMapListener = state.addQueryMapListener(
      (initiator, queryMap) => {
        if (Object.is(initiator, this)) {
          return;
        }

        const indexQuery = queryMap.get(indexUid);

        if (indexQuery !== undefined) {
          // @TODO: the only thing that can matter here, is that pagination is to be reset
          //        so ideally that should be signalled instead
          let { page, hitsPerPage } = indexQuery;

          if (page === undefined) {
            indexQuery.page = page = PAGE_ONE;
          }

          if (hitsPerPage === undefined) {
            indexQuery.hitsPerPage = hitsPerPage = initialHitsPerPage;
          }

          if (page !== this.#page) {
            this.#page = page;
            pageListener(page);
          }

          if (hitsPerPage !== this.#hitsPerPage) {
            this.#hitsPerPage = hitsPerPage;
            hitsPerPageListener(hitsPerPage);
          }
        }
      }
    );

    this.#removeResponseListener = state.addResponseListener(({ results }) => {
      for (const result of results) {
        if (result.indexUid === indexUid) {
          const { hits, totalHits, totalPages, page } = result;

          if (
            totalHits === undefined ||
            totalPages === undefined ||
            page === undefined
          ) {
            state.errorCallback(
              this,
              new Error(
                "one or more of `totalHits`, `totalPages`, `page` is undefined"
              )
            );
            return;
          }

          hitsListener(<Hits<T>>hits);

          if (totalHits !== this.#totalHits) {
            this.#totalHits = totalHits;
            totalHitsListener(totalHits);
          }

          if (totalPages !== this.#totalPages) {
            this.#totalPages = totalPages;
            totalPagesListener(totalPages);
          }

          if (page !== this.#page) {
            this.#page = page;
            pageListener(page);
          }

          return;
        }
      }

      state.errorCallback(
        this,
        new Error(`no response returned for index \`${indexUid}\``)
      );
    });

    this.#state = state;
    this.#indexUid = indexUid;

    this.#hitsPerPageListener = hitsPerPageListener;
    this.#pageListener = pageListener;

    // set initial page and hitsPerPage
    this.#hitsPerPage = initialHitsPerPage;
    this.#page = PAGE_ONE;
    state.changeQuery(this, indexUid, (indexQuery) => {
      indexQuery.hitsPerPage = initialHitsPerPage;
      hitsPerPageListener(initialHitsPerPage);
      indexQuery.page = PAGE_ONE;
      pageListener(PAGE_ONE);
    });
  }

  readonly setHitsPerPage = (hitsPerPage: HitsPerPage): void => {
    const state = getState(this.#state);

    if (hitsPerPage !== this.#hitsPerPage) {
      this.#hitsPerPage = hitsPerPage;
      this.#hitsPerPageListener(hitsPerPage);

      state.changeQuery(this, this.#indexUid, (indexQuery) => {
        indexQuery.hitsPerPage = hitsPerPage;
        indexQuery.page = PAGE_ONE;
      });
    }
  };

  readonly setPage = (page: Page): void => {
    const state = getState(this.#state);

    if (page !== this.#page) {
      this.#page = page;
      this.#pageListener(page);

      state.changeQuery(this, this.#indexUid, (indexQuery) => {
        indexQuery.page = page;
      });
    }
  };

  readonly unmount = (): void => {
    const state = getState(this.#state);

    this.#removeParamsMapListener();
    this.#removeResponseListener();

    state.changeQuery(this, this.#indexUid, (indexQuery) => {
      delete indexQuery.page;
      delete indexQuery.hitsPerPage;
    });

    this.#state = undefined;
  };
}
