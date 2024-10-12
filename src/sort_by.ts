import type { MultiSearchQuery } from "meilisearch";
import type { SearchState } from "./search_state.ts";
import { getState } from "./util.ts";

// export type SortByItem = {
//   /**
//    * The name of the index to target.
//    */
//   value: string;
//   /**
//    * The label of the index to display.
//    */
//   label: string;
// };
// export type SortByConnectorParams = {
//   /**
//    * Array of objects defining the different indices to choose from.
//    */
//   items: SortByItem[];
//   /**
//    * Function to transform the items passed to the templates.
//    */
//   transformItems?: TransformItems<SortByItem>;
// };
// export type SortByRenderState = {
//   /**
//    * The initially selected index.
//    */
//   initialIndex?: string;
//   /**
//    * The currently selected index.
//    */
//   currentRefinement: string;
//   /**
//    * All the available indices
//    */
//   options: SortByItem[];
//   /**
//    * Switches indices and triggers a new search.
//    */
//   refine: (value: string) => void;
//   /**
//    * `true` if the last search contains no result.
//    * @deprecated Use `canRefine` instead.
//    */
//   hasNoResults: boolean;
//   /**
//    * `true` if we can refine.
//    */
//   canRefine: boolean;
// };

type Sort = MultiSearchQuery["sort"];

export type SortRecord = { [TKey: string]: Sort };

export class SortBy<T extends SortRecord> {
  #state?: SearchState;
  readonly #indexUid: string;

  readonly #optionsByKey: Map<keyof T, string>;
  readonly #optionsBySort: Map<string, keyof T>;

  get keys() {
    return Array.from(this.#optionsByKey.keys());
  }

  #key?: keyof T;

  constructor(
    state: SearchState,
    indexUid: string,
    {
      sortOptions,
      defaultSortOptionKey,
      selectedListener,
    }: {
      sortOptions: T;
      defaultSortOptionKey: keyof T;
      selectedListener: (key: keyof T) => void;
    }
  ) {
    // @TODO: This should be more of a Router thing
    // this.#removeListener = state.addQueryMapListener((initiator, queryMap) => {
    //   if (Object.is(initiator, this)) {
    //     return;
    //   }

    //   const indexQuery = queryMap.get(indexUid);
    //   if (indexQuery !== undefined) {
    //     const { sort } = indexQuery;

    //     const stringifiedSort = JSON.stringify(sort ?? null);
    //     const key = this.#optionsBySort.get(stringifiedSort);

    //     if (key === undefined) {
    //       // @TODO: Better error message
    //       state.errorCallback(
    //         this,
    //         new Error("sort option from query is not registered as an option")
    //       );
    //       return;
    //     }

    //     if (key !== this.#key) {
    //       this.#key = key;
    //       selectedListener(key);
    //     }
    //   }
    // });

    this.#state = state;
    this.#indexUid = indexUid;

    this.#optionsByKey = new Map();
    this.#optionsBySort = new Map();

    for (const [key, sort] of Object.entries(sortOptions)) {
      const stringifiedSort = JSON.stringify(sort ?? null);

      if (this.#optionsByKey.has(key)) {
        // @TODO: Better error message
        throw new Error("cannot have same key for more options");
      }

      if (this.#optionsBySort.has(stringifiedSort)) {
        // @TODO: Better error message
        throw new Error("cannot have same value for more options");
      }

      this.#optionsByKey.set(key, stringifiedSort);
      this.#optionsBySort.set(stringifiedSort, key);
    }

    // default sort
    const defaultSort = sortOptions[defaultSortOptionKey];
    state.changeQuery(this, indexUid, (indexQuery) => {
      indexQuery.sort = defaultSort;
      selectedListener(defaultSortOptionKey);
    });
  }

  readonly setSort = (key: keyof T): void => {
    const state = getState(this.#state);

    if (key !== this.#key) {
      const stringifiedSort = this.#optionsByKey.get(key);
      if (stringifiedSort === undefined) {
        throw new Error(`there is no value for key \`${String(key)}\``);
      }

      this.#key = key;
      const sort: Sort = JSON.parse(stringifiedSort) ?? undefined;

      state.changeQuery(this, this.#indexUid, (indexQuery) => {
        indexQuery.sort = sort;

        if (indexQuery.offset !== undefined) {
          delete indexQuery.offset;
        }

        if (indexQuery.page !== undefined) {
          delete indexQuery.page;
        }
      });
    }
  };

  readonly unmount = (): void => {
    const state = getState(this.#state);

    state.changeQuery(this, this.#indexUid, (indexQuery) => {
      delete indexQuery.sort;
    });

    this.#state = undefined;
  };
}
