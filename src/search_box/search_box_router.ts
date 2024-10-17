import type { SearchParams } from "meilisearch";
import type { RouterState } from "../router_state.ts";
import type { SearchState } from "../mod.ts";
import type { Q } from "./model.ts";
import type {
  WithParamsExceptFirst,
  WithParamsExceptFirstTwo,
} from "../util.ts";

export class SearchBoxRouter {
  readonly #removeListener: () => void;
  readonly #modifySearchParams: (
    callback: (searchParams: SearchParams) => void
  ) => void;

  constructor(
    addRouterStateListener: WithParamsExceptFirst<RouterState["addListener"]>,
    {
      changeQuery,
      stateQListener,
    }: {
      changeQuery: WithParamsExceptFirstTwo<SearchState["changeQuery"]>;
      stateQListener: (q: Q) => void;
    }
  ) {
    const { removeListener, modifySearchParams } = addRouterStateListener(
      (searchParams) => {
        const q = searchParams?.q ?? "";
        changeQuery((query) => void (query.q = q));
        stateQListener(q);
      }
    );
    this.#removeListener = removeListener;
    this.#modifySearchParams = modifySearchParams;
  }

  readonly setQ = (q?: string): void => {
    this.#modifySearchParams(
      (searchParams) =>
        void (q === undefined ? delete searchParams.q : (searchParams.q = q))
    );
  };

  readonly unmount = (): void => {
    this.#removeListener();
  };
}
