import type { SearchState } from "../search_state.ts";
import { getSearchState } from "../util.ts";

// TODO: Unfinished
// deno-lint-ignore no-explicit-any
export class Facets<TRecord extends Record<string, any>> {
  #state?: SearchState;
  readonly #indexUid: string;
  readonly #removeResponseListener: () => void;

  constructor(
    state: SearchState,
    indexUid: string,
    facets: (keyof TRecord)[] | ["*"],
  ) {
    state.changeQuery(
      this,
      indexUid,
      (query) => void (query.facets = facets as string[]),
    );

    this.#removeResponseListener = state.addResponseListener(
      indexUid,
      ({ facetDistribution, facetStats }) => {
        if (facetDistribution === undefined || facetStats === undefined) {
          state.errorCallback(
            this,
            new Error(
              "expected `facetDistribution` and `facetStats` to be defined in the response",
            ),
          );
        }
      },
    );

    this.#state = state;
    this.#indexUid = indexUid;
  }

  readonly unmount = (): void => {
    const state = getSearchState(this.#state);

    this.#removeResponseListener();

    state.resetPaginationAndChangeQuery(
      this,
      this.#indexUid,
      (query) => void delete query.facets,
    );

    this.#state = undefined;
  };
}
