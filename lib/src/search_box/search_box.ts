import type { SearchState } from "../search_state.ts";
import type { Q } from "./model.ts";
import type { RouterState } from "../router_state.ts";
import type { SearchBoxRouter } from "./search_box_router.ts";
import { getState } from "../util.ts";

export class SearchBox {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #router?: SearchBoxRouter;

  #q?: Q;
  readonly setQ = (q: Q): void => {
    const state = getState(this.#state);

    if (q !== this.#q) {
      this.#q = q;

      this.#router?.setQ(q || undefined);

      state.resetPaginationAndChangeQuery(
        this,
        this.#indexUid,
        (indexQuery) => void (indexQuery.q = q),
      );
    }
  };

  constructor(
    state: SearchState,
    indexUid: string,
    router?: {
      SearchBoxRouter: typeof SearchBoxRouter;
      routerState: RouterState;
      qListener: (q: Q) => void;
    },
  ) {
    this.#state = state;
    this.#indexUid = indexUid;

    if (router !== undefined) {
      const { SearchBoxRouter, routerState, qListener } = router;
      this.#router = new SearchBoxRouter(
        (...params) => routerState.addListener(indexUid, ...params),
        {
          changeQuery: (...params) =>
            state.changeQuery(this, indexUid, ...params),
          stateQListener: (q) => {
            this.#q = q;
            qListener(q);
          },
        },
      );
    }
  }

  readonly unmount = (): void => {
    const state = getState(this.#state);

    state.resetPaginationAndChangeQuery(
      this,
      this.#indexUid,
      (indexQuery) => void delete indexQuery.q,
    );

    if (this.#router !== undefined) {
      this.#router.setQ(undefined);
      this.#router.unmount();
    }

    this.#state = undefined;
  };
}
