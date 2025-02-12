import type { SearchState } from "../search_state.ts";
import { getSearchState } from "../util.ts";

// deno-lint-ignore no-explicit-any
export class Filters<TRecord extends Record<string, any>> {
  #state?: SearchState;
  readonly #indexUid: string;

  constructor(state: SearchState, indexUid: string) {
    this.#state = state;
    this.#indexUid = indexUid;
  }

  readonly unmount = (): void => {
    const state = getSearchState(this.#state);

    state.resetPaginationAndChangeQuery(
      this,
      this.#indexUid,
      (query) => void delete query.facets,
    );

    this.#state = undefined;
  };
}
