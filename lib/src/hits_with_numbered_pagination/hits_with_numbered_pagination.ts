import type { SearchState } from "../search_state.ts";
import type {
  Hits,
  HitsPerPage,
  HitsWithNumberedPaginationOptions,
  Page,
  TotalHits,
  TotalPages,
} from "./model.ts";
import {
  type CachedSetterWithCallback,
  getCachedSetterWithCallback,
  getSearchState,
} from "../util.ts";
import { DEFAULT_HITS_PER_PAGE, DEFAULT_PAGE } from "./model.ts";

export class HitsWithNumberedPagination<
  // deno-lint-ignore no-explicit-any
  T extends Record<string, any> = Record<string, any>,
> {
  #state?: SearchState;
  readonly #indexUid: string;
  // readonly #router?: HitsWithNumberedPaginationRouter;
  readonly #removeResetPaginationListener: () => void;
  readonly #removeResponseListener: () => void;

  readonly #callbacks: HitsWithNumberedPaginationOptions<T>["callbacks"];

  readonly setHitsPerPage: CachedSetterWithCallback<HitsPerPage>;
  readonly setPage: CachedSetterWithCallback<Page>;
  readonly #setTotalHits: CachedSetterWithCallback<TotalHits>;
  readonly #setTotalPages: CachedSetterWithCallback<TotalPages>;

  constructor({
    state,
    indexUid,
    defaultHitsPerPage = DEFAULT_HITS_PER_PAGE,
    callbacks,
  }: HitsWithNumberedPaginationOptions<T>) {
    this.#state = state;
    this.#indexUid = indexUid;
    this.#callbacks = callbacks;

    this.setPage = getCachedSetterWithCallback<number>(DEFAULT_PAGE, (v) => {
      const state = getSearchState(this.#state);

      callbacks?.pageListener?.(v, v === DEFAULT_PAGE);

      state.changeQuery(
        this,
        indexUid,
        (indexQuery) => void (indexQuery.page = v),
      );
    });

    this.setHitsPerPage = getCachedSetterWithCallback<number>(
      defaultHitsPerPage,
      (v) => {
        const state = getSearchState(this.#state);

        this.#callbacks?.hitsPerPageListener?.(v, v === defaultHitsPerPage);

        state.changeQuery(this, this.#indexUid, (indexQuery) => {
          indexQuery.hitsPerPage = v;
        });

        this.setPage(null);
      },
    );

    this.#setTotalHits = getCachedSetterWithCallback<number | undefined>(
      undefined,
      (v) => {
        if (v !== undefined) {
          callbacks?.totalHitsListener?.(v);
        }
      },
    );

    this.#setTotalPages = getCachedSetterWithCallback<number | undefined>(
      undefined,
      (v) => {
        if (v !== undefined) {
          callbacks?.totalPagesListener?.(v);
        }
      },
    );

    this.#removeResetPaginationListener = state.addResetPaginationListener(
      indexUid,
      () => void this.setPage(null),
    );

    this.#removeResponseListener = state.addResponseListener(
      indexUid,
      (response) => {
        const { hits, totalHits, totalPages, page } = response;

        if (
          totalHits === undefined ||
          totalPages === undefined ||
          page === undefined
        ) {
          state.errorCallback(
            this,
            new Error(
              "one or more of `totalHits`, `totalPages`, `page` is undefined in response",
              { cause: response },
            ),
          );
          return;
        }

        callbacks?.hitsListener?.(<Hits<T>> hits);

        this.#setTotalHits(totalHits);
        this.#setTotalPages(totalPages);
        this.setPage(page);
      },
    );
  }

  readonly unmount = (): void => {
    const state = getSearchState(this.#state);

    this.#removeResetPaginationListener();
    this.#removeResponseListener();

    state.changeQuery(this, this.#indexUid, (indexQuery) => {
      delete indexQuery.page;
      delete indexQuery.hitsPerPage;
    });

    this.#callbacks?.unmount?.();

    this.#state = undefined;
  };
}
