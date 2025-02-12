import type { LayoutLoad } from "./$types";

export const ssr = false;

export const load: LayoutLoad = async () => {
  return {
    routerState: await db.getPostSummaries(),
  };
};
