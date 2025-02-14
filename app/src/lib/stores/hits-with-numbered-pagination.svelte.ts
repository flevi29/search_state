import {
  getRoutedHitsWithNumberedPagination,
  type RouterState,
  type SearchState,
} from "@search-state/lib";
import type { Hits } from "meilisearch";

export function getHitsWithNumberedPaginationWidget<T>(
  indexUid: string,
  searchState: SearchState,
  routerState: RouterState,
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
    ...getRoutedHitsWithNumberedPagination({
      routerState,
      state: searchState,
      indexUid,
      defaultHitsPerPage: initialHitsPerPage,
      callbacks: {
        hitsPerPageListener: (v) => void (hitsPerPage = v),
        hitsListener: (v) => void (hits = v),
        totalHitsListener: (v) => void (totalHits = v),
        totalPagesListener: (v) => void (totalPages = v),
        pageListener: (v) => void (page = v),
      },
    }),
  };
}
