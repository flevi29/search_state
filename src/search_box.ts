import type { MultiSearchQuery } from "meilisearch";
import type { SearchState } from "./search_state.ts";
import { getState } from "./util.ts";

// export type SearchBoxConnectorParams = {
//   /**
//    * A function that will be called every time
//    * a new value for the query is set. The first parameter is the query and the second is a
//    * function to actually trigger the search. The function takes the query as the parameter.
//    *
//    * This queryHook can be used to debounce the number of searches done from the searchBox.
//    */
//   queryHook?: (query: string, hook: (value: string) => void) => void;
// };
// /**
//  * @typedef {Object} CustomSearchBoxWidgetParams
//  * @property {function(string, function(string))} [queryHook = undefined] A function that will be called every time
//  * a new value for the query is set. The first parameter is the query and the second is a
//  * function to actually trigger the search. The function takes the query as the parameter.
//  *
//  * This queryHook can be used to debounce the number of searches done from the searchBox.
//  */
// export type SearchBoxRenderState = {
//   /**
//    * The query from the last search.
//    */
//   query: string;
//   /**
//    * Sets a new query and searches.
//    */
//   refine: (value: string) => void;
//   /**
//    * Remove the query and perform search.
//    */
//   clear: () => void;
//   /**
//    * `true` if the search results takes more than a certain time to come back
//    * from Algolia servers. This can be configured on the InstantSearch constructor with the attribute
//    * `stalledSearchDelay` which is 200ms, by default.
//    * @deprecated use `instantSearchInstance.status` instead
//    */
//   isSearchStalled: boolean;
// };

type Q = NonNullable<MultiSearchQuery["q"]>;

// TODO:
type MatchingStrategy = NonNullable<MultiSearchQuery["matchingStrategy"]>;
type AttributesToSearchOn = NonNullable<
  MultiSearchQuery["attributesToSearchOn"]
>;

export class SearchBox {
  #state?: SearchState;
  readonly #indexUid: string;

  #q?: Q;

  constructor(state: SearchState, indexUid: string, qListener: (q: Q) => void) {
    // TODO: This should be more of a Router thing
    // this.#removeListener = state.addQueryMapListener((initiator, queryMap) => {
    //   if (Object.is(initiator, this)) {
    //     return;
    //   }

    //   const indexQuery = queryMap.get(indexUid);
    //   if (indexQuery !== undefined) {
    //     const q = indexQuery.q ?? "";

    //     if (q !== this.#q) {
    //       this.#q = q;
    //       qListener(q);
    //     }
    //   }
    // });

    this.#state = state;
    this.#indexUid = indexUid;
  }

  readonly setQ = (q: Q): void => {
    const state = getState(this.#state);

    if (q !== this.#q) {
      this.#q = q;

      state.changeQueryAndResetPagination(
        this,
        this.#indexUid,
        (indexQuery) => void (indexQuery.q = q),
      );
    }
  };

  readonly unmount = (): void => {
    const state = getState(this.#state);

    state.changeQueryAndResetPagination(
      this,
      this.#indexUid,
      (indexQuery) => void delete indexQuery.q,
    );

    this.#state = undefined;
  };
}
