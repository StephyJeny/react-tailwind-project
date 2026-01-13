import algoliasearch from "algoliasearch";

const appId = import.meta.env.VITE_ALGOLIA_APP_ID;
const apiKey = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY;
export const indexName = import.meta.env.VITE_ALGOLIA_INDEX;

export const searchClient =
  appId && apiKey ? algoliasearch(appId, apiKey) : null;

