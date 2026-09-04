import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  sortFn_basic,
  sortFn_datetime,
  sortFn_text,
  tableFeatures,
} from "@tanstack/react-table";

/**
 * Shared feature set for every table in the app.
 *
 * In v9 an API only exists when its feature is registered here, so this object
 * is the single source of truth for what our tables can do. Anything not listed
 * is tree-shaken out of the bundle.
 *
 * Declared at module scope: the reference must stay stable across renders.
 *
 * Deliberately not registered, because nothing in the app uses them: column
 * pinning, sizing, resizing, visibility, ordering, grouping, expanding,
 * faceting, aggregation, row pinning, row selection, cell selection.
 */
export const appTableFeatures = tableFeatures({
  // Prerequisites must come before the slots that depend on them:
  // globalFilteringFeature requires columnFilteringFeature, and every
  // row-model slot requires its own feature to be declared first.
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  rowPaginationFeature,

  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  paginatedRowModel: createPaginatedRowModel(),

  // Only the built-ins our columns reference by name, or that `sortFn: 'auto'`
  // needs to resolve. Importing the whole registry object would bundle all of them.
  filterFns: { includesString: filterFn_includesString },
  sortFns: {
    alphanumeric: sortFn_alphanumeric,
    basic: sortFn_basic,
    datetime: sortFn_datetime,
    text: sortFn_text,
  },
});

export type AppTableFeatures = typeof appTableFeatures;
