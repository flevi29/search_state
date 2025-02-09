import {
  RouterState,
  SearchBox,
  SearchBoxRouter,
  type SearchState,
} from "@search-state/lib";

export function getSearchBoxWidget(
  indexUid: string,
  searchState: SearchState,
  routerState?: RouterState,
) {
  let q = $state<string | null>(null);

  return {
    get q() {
      return q;
    },
    ...new SearchBox(
      searchState,
      indexUid,
      routerState !== undefined
        ? {
            SearchBoxRouter,
            routerState,
            qListener: (v) => void (q = v),
          }
        : undefined,
    ),
  };
}
