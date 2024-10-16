import {
  RouterState,
  SearchBox,
  SearchBoxRouter,
  type SearchState,
} from "$rootSrc/mod";

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
            listener: (v) => void (q = v),
          }
        : undefined,
    ),
  };
}
