import type { SearchState } from "../search_state.ts";
import { DEFAULT_Q, type Q, type SearchBoxOptions } from "./model.ts";
import {
  type CachedSetterWithCallback,
  getCachedSetterWithCallback,
  getSearchState,
} from "../util.ts";

export class SearchBox {
  #searchState?: SearchState;
  readonly #indexUid: string;
  readonly #callbacks: SearchBoxOptions["callbacks"];

  readonly setQ: CachedSetterWithCallback<Q>;

  constructor({ searchState, indexUid, callbacks }: SearchBoxOptions) {
    this.#searchState = searchState;
    this.#indexUid = indexUid;
    this.#callbacks = callbacks;

    this.setQ = getCachedSetterWithCallback<Q>(DEFAULT_Q, (v) => {
      const state = getSearchState(this.#searchState);

      callbacks?.qListener?.(v, v === DEFAULT_Q);

      state.resetPaginationAndChangeQuery(
        this,
        indexUid,
        (indexQuery) => void (indexQuery.q = v),
      );
    });
  }

  readonly unmount = (): void => {
    const state = getSearchState(this.#searchState);

    state.resetPaginationAndChangeQuery(
      this,
      this.#indexUid,
      (indexQuery) => void delete indexQuery.q,
    );

    this.#callbacks?.unmount?.();

    this.#searchState = undefined;
  };
}
