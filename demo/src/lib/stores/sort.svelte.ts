import { SortBy, type SortRecord, type SearchState } from "$rootSrc/mod";

// TODO: We need to query this
const sortOptions = {
  default: undefined,
  byScore: ["score:asc"],
  byTitle: ["title:asc"],
} satisfies SortRecord;

type SortOptions = typeof sortOptions;

const sortOptionsKeys = <(keyof SortOptions)[]>Object.keys(sortOptions);

type SortKey = keyof SortOptions;

const translations: { [TKey in SortKey]: string } = {
  default: "Match score",
  byScore: "Score",
  byTitle: "Title",
};

function getSortByWidget(indexUid: string, searchState: SearchState) {
  let selectedSortKey = $state<SortKey | null>(null);

  return {
    get selectedSortKey() {
      return selectedSortKey;
    },
    ...new SortBy(searchState, indexUid, {
      sortOptions,
      defaultSortOptionKey: "default",
      selectedListener(v) {
        selectedSortKey = v;
      },
    }),
  };
}

export { sortOptionsKeys, translations, getSortByWidget, type SortKey };
