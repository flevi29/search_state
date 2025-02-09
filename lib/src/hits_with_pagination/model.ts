import type { MultiSearchQuery, MultiSearchResult } from "meilisearch";

// type PaginationConnectorParams = {
//   /**
//    * The total number of pages to browse.
//    */
//   totalPages?: number;
//   /**
//    * The padding of pages to show around the current page
//    * @default 3
//    */
//   padding?: number;
// };
// export type PaginationRenderState = {
//   /** Creates URLs for the next state, the number is the page to generate the URL for. */
//   createURL: CreateURL<number>;
//   /** Sets the current page and triggers a search. */
//   refine: (page: number) => void;
//   /** true if this search returned more than one page */
//   canRefine: boolean;
//   /** The number of the page currently displayed. */
//   currentRefinement: number;
//   /** The number of hits computed for the last query (can be approximated). */
//   nbHits: number;
//   /** The number of pages for the result set. */
//   nbPages: number;
//   /** The actual pages relevant to the current situation and padding. */
//   pages: number[];
//   /** true if the current page is also the first page. */
//   isFirstPage: boolean;
//   /** true if the current page is also the last page. */
//   isLastPage: boolean;
// };

// How do I implement a widget for these attributes?
// I want them to be settable and listenable, which means it'll be possible to set them from the router.

type AttributesToRetrieve = NonNullable<
  MultiSearchQuery["attributesToRetrieve"]
>;
//
type AttributesToCrop = NonNullable<MultiSearchQuery["attributesToCrop"]>;
type CropLength = NonNullable<MultiSearchQuery["cropLength"]>;
type CropMarker = NonNullable<MultiSearchQuery["cropMarker"]>;
//
type AttributesToHighlight = NonNullable<
  MultiSearchQuery["attributesToHighlight"]
>;
type HighlightPreTag = NonNullable<MultiSearchQuery["highlightPreTag"]>;
type HighlightPostTag = NonNullable<MultiSearchQuery["highlightPostTag"]>;
//
type ShowMatchesPosition = NonNullable<MultiSearchQuery["showMatchesPosition"]>;
//
type ShowRankingScore = NonNullable<MultiSearchQuery["showRankingScore"]>;
//
type ShowRankingScoreDetails = NonNullable<
  MultiSearchQuery["showRankingScoreDetails"]
>;

// deno-lint-ignore no-explicit-any
export type Hits<T extends Record<string, any>> = MultiSearchResult<T>["hits"];
export type EstimatedTotalHits = NonNullable<
  MultiSearchResult<never>["estimatedTotalHits"]
>;
export type Limit = NonNullable<MultiSearchQuery["limit"]>;
export type Offset = NonNullable<MultiSearchQuery["offset"]>;

// deno-lint-ignore no-explicit-any
export type HitsWithPaginationOptions<T extends Record<string, any>> = {
  initialLimit: number;
  hitsListener: (hits: Hits<T>) => void;
  estimatedTotalHitsListener: (estimatedTotalHits: EstimatedTotalHits) => void;
  limitListener: (limit: number) => void;
  pageListener: (page: number) => void;
  hasPreviousListener: (hasPrevious: boolean) => void;
  hasNextListener: (hasNext: boolean) => void;
};
