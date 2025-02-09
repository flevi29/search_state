import type { SearchState } from "../search_state.ts";
import { getState } from "../util.ts";

// deno-lint-ignore no-explicit-any
export class Filters<TRecord extends Record<string, any>> {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #removeFilterListener: () => void;

  constructor(state: SearchState, indexUid: string) {
    this.#removeFilterListener = state.addFilterListener(indexUid, (filter) => {
      //
    });

    this.#state = state;
    this.#indexUid = indexUid;
  }

  readonly unmount = (): void => {
    const state = getState(this.#state);

    this.#removeFilterListener();

    state.resetPaginationAndChangeQuery(
      this,
      this.#indexUid,
      (query) => void delete query.facets,
    );

    this.#state = undefined;
  };
}
