// // TODO: Decide whether we really want this, it's a little more complicated
// import type { SearchParams } from "meilisearch";
// import type { RouterState } from "../router_state.ts";
// import type {
//   WithParamsExceptFirst,
//   WithParamsExceptFirstTwo,
// } from "../util.ts";
// import type { SearchState } from "../search_state.ts";

// export class HitsWithPaginationRouter {
//   readonly #removeListener: () => void;
//   readonly #modifySearchParams: (
//     callback: (searchParams: SearchParams) => void,
//   ) => void;

//   constructor(
//     initialLimit: number,
//     addRouterStateListener: WithParamsExceptFirst<RouterState["addListener"]>,
//     {
//       changeQuery,
//       stateHitsPerPageListener,
//     }: {
//       changeQuery: WithParamsExceptFirstTwo<SearchState["changeQuery"]>;
//       stateHitsPerPageListener: (hitsPerPage: HitsPerPage) => void;
//     },
//   ) {
//     const { removeListener, modifySearchParams } = addRouterStateListener(
//       (searchParams) => {
//         //
//       },
//     );
//     this.#removeListener = removeListener;
//     this.#modifySearchParams = modifySearchParams;
//   }

//   readonly unmount = (): void => {
//     this.#removeListener();
//   };
// }
