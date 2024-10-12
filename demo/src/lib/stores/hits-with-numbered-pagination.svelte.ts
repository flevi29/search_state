import { HitsWithNumberedPagination, type SearchState } from "$rootSrc/mod";
import type { Hits } from "meilisearch";

export function getHitsWithNumberedPaginationWidget<T>(
  indexUid: string,
  searchState: SearchState,
) {
  let hitsPerPage = $state<number | null>(null),
    hits = $state<Hits<Record<string, T>> | null>(null),
    totalHits = $state<number | null>(null),
    totalPages = $state<number | null>(null),
    page = $state<number | null>(null);

  const initialHitsPerPage = 2;

  return {
    initialHitsPerPage,
    get hitsPerPage() {
      return hitsPerPage;
    },
    get hits() {
      return hits;
    },
    get totalHits() {
      return totalHits;
    },
    get totalPages() {
      return totalPages;
    },
    get page() {
      return page;
    },
    ...new HitsWithNumberedPagination(searchState, indexUid, {
      initialHitsPerPage,
      hitsPerPageListener(v) {
        hitsPerPage = v;
      },
      hitsListener(v) {
        hits = v;
      },
      totalHitsListener(v) {
        totalHits = v;
      },
      totalPagesListener(v) {
        totalPages = v;
      },
      pageListener(v) {
        page = v;
      },
    }),
  };
}
