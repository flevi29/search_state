import type { SearchParams } from "meilisearch";
import type { RouterState } from "../router_state.ts";
import type { HitsPerPage, Page } from "./model.ts";
import type {
  WithParamsExceptFirst,
  WithParamsExceptFirstTwo,
} from "../util.ts";
import type { SearchState } from "../search_state.ts";
import { PAGE_ONE } from "./model.ts";

export class HitsWithNumberedPaginationRouter {
  readonly #removeListener: () => void;
  readonly #modifySearchParams: (
    callback: (searchParams: SearchParams) => void
  ) => void;

  constructor(
    initialHitsPerPage: HitsPerPage,
    addRouterStateListener: WithParamsExceptFirst<RouterState["addListener"]>,
    {
      changeQuery,
      stateHitsPerPageListener,
      statePageListener,
    }: {
      changeQuery: WithParamsExceptFirstTwo<SearchState["changeQuery"]>;
      stateHitsPerPageListener: (hitsPerPage: HitsPerPage) => void;
      statePageListener: (page: Page) => void;
    }
  ) {
    const { removeListener, modifySearchParams } = addRouterStateListener(
      (searchParams) => {
        const hitsPerPage = searchParams?.hitsPerPage ?? initialHitsPerPage;
        stateHitsPerPageListener(hitsPerPage);

        const page = searchParams?.page ?? PAGE_ONE;
        statePageListener(page);

        changeQuery((query) => {
          query.hitsPerPage = hitsPerPage;
          query.page = page;
        });
      }
    );
    this.#removeListener = removeListener;
    this.#modifySearchParams = modifySearchParams;
  }

  readonly setHitsPerPage = (hitsPerPage?: HitsPerPage): void => {
    this.#modifySearchParams(
      (searchParams) =>
        void (hitsPerPage === undefined
          ? delete searchParams.hitsPerPage
          : (searchParams.hitsPerPage = hitsPerPage))
    );
  };

  readonly setPage = (page?: Page): void => {
    this.#modifySearchParams(
      (searchParams) =>
        void (page === undefined
          ? delete searchParams.page
          : (searchParams.page = page))
    );
  };

  readonly unmount = (): void => {
    this.#removeListener();
  };
}
