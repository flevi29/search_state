import type { SearchState } from "../search_state.ts";
import type {
  Hits,
  HitsPerPage,
  HitsWithNumberedPaginationOptions,
  Page,
  TotalHits,
  TotalPages,
} from "./model.ts";
import { getState } from "../util.ts";
import { PAGE_ONE } from "./model.ts";
import type { RouterState } from "../mod.ts";
import type { HitsWithNumberedPaginationRouter } from "./hits_with_numbered_pagination_router.ts";

export class HitsWithNumberedPagination<
  // deno-lint-ignore no-explicit-any
  T extends Record<string, any> = Record<string, any>,
> {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #router?: HitsWithNumberedPaginationRouter;
  readonly #removeResetPaginationListener: () => void;
  readonly #removeResponseListener: () => void;

  readonly #hitsPerPageListener: HitsWithNumberedPaginationOptions<
    T
  >["hitsPerPageListener"];
  readonly #pageListener: HitsWithNumberedPaginationOptions<T>["pageListener"];

  readonly #initialHitsPerPage: HitsPerPage;
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
    }: HitsWithNumberedPaginationOptions<T>,
    router?: {
      HitsWithNumberedPaginationRouter: typeof HitsWithNumberedPaginationRouter;
      routerState: RouterState;
    },
  ) {
    this.#removeResetPaginationListener = state.addResetPaginationListener(
      indexUid,
      (query) => {
        if (query.page !== PAGE_ONE) {
          query.page = this.#page = PAGE_ONE;
          pageListener(PAGE_ONE);

          this.#router?.setPage(undefined);
        }
      },
    );

    this.#removeResponseListener = state.addResponseListener(
      indexUid,
      ({ hits, totalHits, totalPages, page }) => {
        if (
          totalHits === undefined ||
          totalPages === undefined ||
          page === undefined
        ) {
          state.errorCallback(
            this,
            new Error(
              "one or more of `totalHits`, `totalPages`, `page` is undefined",
            ),
          );
          return;
        }

        hitsListener(<Hits<T>> hits);

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

          this.#router?.setPage(page);
        }
      },
    );

    this.#state = state;
    this.#indexUid = indexUid;

    this.#hitsPerPageListener = hitsPerPageListener;
    this.#pageListener = pageListener;

    // set initial page and hitsPerPage
    this.#initialHitsPerPage = initialHitsPerPage;
    this.#hitsPerPage = initialHitsPerPage;
    this.#page = PAGE_ONE;
    state.changeQuery(this, indexUid, (indexQuery) => {
      indexQuery.hitsPerPage = initialHitsPerPage;
      hitsPerPageListener(initialHitsPerPage);
      indexQuery.page = PAGE_ONE;
      pageListener(PAGE_ONE);
    });

    if (router !== undefined) {
      const { HitsWithNumberedPaginationRouter, routerState } = router;
      this.#router = new HitsWithNumberedPaginationRouter(
        initialHitsPerPage,
        (...params) => routerState.addListener(indexUid, ...params),
        {
          changeQuery: (...params) =>
            state.changeQuery(this, indexUid, ...params),
          stateHitsPerPageListener: (hitsPerPage) => {
            this.#hitsPerPage = hitsPerPage;
            hitsPerPageListener(hitsPerPage);
          },
          statePageListener: (page) => {
            this.#page = page;
            pageListener(page);
          },
        },
      );
    }
  }

  readonly setHitsPerPage = (hitsPerPage: HitsPerPage): void => {
    const state = getState(this.#state);

    if (hitsPerPage !== this.#hitsPerPage) {
      this.#hitsPerPage = hitsPerPage;
      this.#hitsPerPageListener(hitsPerPage);

      this.#router?.setHitsPerPage(
        hitsPerPage === this.#initialHitsPerPage ? undefined : hitsPerPage,
      );

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

      this.#router?.setPage(page === PAGE_ONE ? undefined : page);

      state.changeQuery(
        this,
        this.#indexUid,
        (indexQuery) => void (indexQuery.page = page),
      );
    }
  };

  readonly unmount = (): void => {
    const state = getState(this.#state);

    this.#removeResetPaginationListener();
    this.#removeResponseListener();

    state.changeQuery(this, this.#indexUid, (indexQuery) => {
      delete indexQuery.page;
      delete indexQuery.hitsPerPage;
    });

    if (this.#router !== undefined) {
      this.#router.setHitsPerPage(undefined);
      this.#router.setPage(undefined);
      this.#router.unmount();
    }

    this.#state = undefined;
  };
}
