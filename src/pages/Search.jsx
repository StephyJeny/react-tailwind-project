import React from "react";
import {
  InstantSearch,
  SearchBox,
  Hits,
  Pagination,
  RefinementList,
  Configure,
} from "react-instantsearch-hooks-web";
import { searchClient, indexName } from "../services/algoliaClient";

function Hit({ hit }) {
  const title = hit.name || hit.title || hit.objectID;
  const description = hit.description || "";
  const price = hit.price;
  const category = hit.category || hit.categories?.[0];

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {category && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{category}</p>
          )}
        </div>
        {typeof price === "number" && (
          <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
            ${price.toFixed(2)}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{description}</p>
      )}
    </div>
  );
}

export default function Search() {
  if (!searchClient || !indexName) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Search
        </h1>
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Algolia is not configured. Add VITE_ALGOLIA_APP_ID, VITE_ALGOLIA_SEARCH_API_KEY and VITE_ALGOLIA_INDEX to your environment.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Search
      </h1>

      <InstantSearch searchClient={searchClient} indexName={indexName}>
        <Configure hitsPerPage={12} />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="lg:col-span-1 space-y-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-800">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                Categories
              </h2>
              <RefinementList attribute="category" />
            </div>
          </aside>

          <div className="lg:col-span-3 space-y-4">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 bg-white dark:bg-gray-800">
              <SearchBox
                placeholder="Search..."
                classNames={{
                  root: "w-full",
                  input:
                    "w-full px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500",
                  submitIcon: "hidden",
                  resetIcon: "hidden",
                }}
              />
            </div>

            <Hits
              hitComponent={Hit}
              classNames={{
                root: "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4",
                list: "contents",
                item: "contents",
              }}
            />

            <div className="flex justify-end">
              <Pagination />
            </div>
          </div>
        </div>
      </InstantSearch>
    </div>
  );
}

