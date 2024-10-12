import { SearchBox, type SearchState } from "$rootSrc/mod";

export function getSearchBoxWidget(indexUid: string, searchState: SearchState) {
  let q = $state<string | null>(null);

  return {
    get q() {
      return q;
    },
    ...new SearchBox(searchState, indexUid, (v) => {
      q = v;
    }),
  };
}
