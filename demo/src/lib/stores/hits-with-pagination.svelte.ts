import { HitsWithPagination, type SearchState } from "$rootSrc/mod";
import type { Hits } from "meilisearch";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getHitsWithPaginationWidget<T extends Record<string, any>>(
  indexUid: string,
  searchState: SearchState,
) {
  let hits = $state<Hits<T> | null>(null),
    estimatedTotalHits = $state<number | null>(null),
    limit = $state<number | null>(null),
    page = $state<number | null>(null),
    hasPrevious = $state<boolean>(false),
    hasNext = $state<boolean>(false);

  const initialLimit = 2;

  return {
    initialLimit,
    get hits() {
      return hits;
    },
    get estimatedTotalHits() {
      return estimatedTotalHits;
    },
    get limit() {
      return limit;
    },
    get page() {
      return page;
    },
    get hasPrevious() {
      return hasPrevious;
    },
    get hasNext() {
      return hasNext;
    },
    ...new HitsWithPagination<T>(searchState, indexUid, {
      initialLimit,
      hitsListener(v) {
        hits = v;
      },
      estimatedTotalHitsListener(v) {
        estimatedTotalHits = v;
      },
      limitListener(v) {
        limit = v;
      },
      pageListener(v) {
        page = v;
      },
      hasPreviousListener(v) {
        hasPrevious = v;
      },
      hasNextListener(v) {
        hasNext = v;
      },
    }),
  };
}
