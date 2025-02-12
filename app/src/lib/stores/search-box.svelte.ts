import {
  RouterState,
  getRoutedSearchBox,
  type SearchState,
} from "@search-state/lib";

export function getSearchBoxWidget(
  indexUid: string,
  searchState: SearchState,
  routerState: RouterState,
) {
  let q = $state<string>("");

  return {
    get q() {
      return q;
    },
    ...getRoutedSearchBox({
      searchState,
      indexUid,
      routerState,
      callbacks: { qListener: (v) => void (q = v) },
    }),
  };
}
