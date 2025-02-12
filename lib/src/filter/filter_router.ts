import type { SearchParams } from "meilisearch";
import type { RouterState } from "../router_state.ts";
import type { SearchState } from "../mod.ts";
import type { Filter } from "./model.ts";
import type {
  WithParamsExceptFirst,
  WithParamsExceptFirstTwo,
} from "../util.ts";

export class FilterRouter {
  readonly #removeListener: () => void;
  readonly #modifySearchParams: (
    callback: (searchParams: SearchParams) => void,
  ) => void;

  constructor(
    addRouterStateListener: WithParamsExceptFirst<RouterState["addListener"]>,
    {
      changeQuery,
      stateFilterListener,
    }: {
      changeQuery: WithParamsExceptFirstTwo<SearchState["changeQuery"]>;
      stateFilterListener: (filter: Filter) => void;
    },
  ) {
    const { removeListener, modifySearchParams } = addRouterStateListener(
      (searchParams) => {
        const filter = searchParams?.filter;
        changeQuery((query) => void (query.filter = filter));
        stateFilterListener(q);
      },
    );
    this.#removeListener = removeListener;
    this.#modifySearchParams = modifySearchParams;
  }

  readonly setQ = (q?: string): void => {
    this.#modifySearchParams(
      (searchParams) =>
        void (q === undefined ? delete searchParams.q : (searchParams.q = q)),
    );
  };

  readonly unmount = (): void => {
    this.#removeListener();
  };
}
