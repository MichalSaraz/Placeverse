/**
 * Composable for managing filters and sorting in URL query parameters
 * 
 * Centralizes logic for:
 * - Reading and writing query parameters to URL
 * - Reactive tracking of URL changes
 * - Clearing all filters
 * - Composing and validating query objects
 */

export interface FilterState {
  category: string | null;
  visited: boolean | null;
  hasPhotos: boolean | null;
  hasLinks: boolean | null;
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  search: string | null;
  page: number;
}

export interface FilterOptions {
  category?: string | null;
  visited?: boolean | null;
  hasPhotos?: boolean | null;
  hasLinks?: boolean | null;
}

export interface SortOptions {
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface SearchOptions {
  search?: string | null;
}

export interface PaginationOptions {
  page?: number;
}

export const useQueryFilters = () => {
  const route = useRoute();
  const router = useRouter();

  /**
   * Default values for filters
   */
  const defaultValues: FilterState = {
    category: null,
    visited: null,
    hasPhotos: null,
    hasLinks: null,
    sortBy: 'created_at',
    sortDirection: 'desc',
    search: null,
    page: 1,
  };

  /**
   * Reactive filter state synchronized with URL
   */
  const filters = reactive<FilterState>({ ...defaultValues });

  /**
   * Parses query parameters into a typed object
   */
  function parseQueryToFilters(query: Record<string, string | string[] | undefined>): FilterState {
    return {
      category: query.category ? String(query.category) : null,
      visited: query.visited ? query.visited === 'true' : null,
      hasPhotos: query.hasPhotos ? query.hasPhotos === 'true' : null,
      hasLinks: query.hasLinks ? query.hasLinks === 'true' : null,
      sortBy: query.sortBy ? String(query.sortBy) : defaultValues.sortBy,
      sortDirection: query.sortDirection === 'asc' ? 'asc' : defaultValues.sortDirection,
      search: query.q ? String(query.q) : null,
      page: query.page ? Math.max(1, parseInt(String(query.page), 10) || 1) : defaultValues.page,
    };
  }

  /**
   * Converts filter state to query objects with removal of default values
   */
  function filtersToQuery(state: FilterState): Record<string, string | undefined> {
    const query: Record<string, string | undefined> = { ...route.query };

    // Filters
    query.category = state.category || undefined;
    query.visited = state.visited !== null ? String(state.visited) : undefined;
    query.hasPhotos = state.hasPhotos !== null ? String(state.hasPhotos) : undefined;
    query.hasLinks = state.hasLinks !== null ? String(state.hasLinks) : undefined;

    // Sorting
    query.sortBy = state.sortBy;
    query.sortDirection = state.sortDirection;

    // Search
    query.q = state.search || undefined;

    // Pagination
    query.page = state.page !== defaultValues.page ? String(state.page) : undefined;

    return query;
  }

  /**
   * Updates URL with new query parameters
   */
  function updateUrl(newState?: Partial<FilterState>) {
    if (newState) {
      Object.assign(filters, newState);
    }

    const newQuery = filtersToQuery(filters);
    router.replace({ query: newQuery });
  }

  /**
   * Initializes filters from current query parameters
   */
  function initializeFromQuery() {
    const parsed = parseQueryToFilters(route.query);
    Object.assign(filters, parsed);
  }

  /**
   * Clears all filters to default values
   */
  function clearFilters() {
    const newState = { ...defaultValues };

    if (filters.search) newState.search = filters.search;
    if (route.query.page) newState.page = filters.page;
    
    updateUrl(newState);
  }

  /**
   * Clears only filters, preserves sorting and search
   */
  function clearFilterOptions() {
    updateUrl({
      category: null,
      visited: null,
      hasPhotos: null,
      hasLinks: null,
    });
  }

  /**
   * Updates only filters
   * 
   * @param newFilters - Partial filter options to update
   */
  function updateFilters(newFilters: FilterOptions) {
    updateUrl(newFilters);
  }

  /**
   * Updates only sorting
   * 
   * @param sortOptions - Sorting options to update
   */
  function updateSort(sortOptions: SortOptions) {
    updateUrl(sortOptions);
  }

  /**
   * Updates search and resets pagination
   * 
   * @param searchOptions - Search options to update
   */
  function updateSearch(searchOptions: SearchOptions) {
    updateUrl({
      ...searchOptions,
      page: 1,
    });
  }

  /**
   * Updates pagination
   * 
   * @param pageOptions - Pagination options to update
   */
  function updatePage(pageOptions: PaginationOptions) {
    updateUrl(pageOptions);
  }

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = computed(() => {
    return (
      filters.category !== null ||
      filters.visited !== null ||
      filters.hasPhotos !== null ||
      filters.hasLinks !== null
    );
  });

  /**
   * Check if non-default sorting is active
   */
  const hasCustomSort = computed(() => {
    return (
      filters.sortBy !== defaultValues.sortBy ||
      filters.sortDirection !== defaultValues.sortDirection
    );
  });

  /**
   * Check if search is active
   */
  const hasActiveSearch = computed(() => {
    return filters.search !== null && filters.search.trim().length > 0;
  });

  /**
   * Watch URL changes and update state
   */
  watch(
    () => route.query,
    () => {
      const parsed = parseQueryToFilters(route.query);

      if (JSON.stringify(parsed) !== JSON.stringify(filters)) {
        Object.assign(filters, parsed);
      }
    },
    { immediate: false }
  );

  // Initialize on creation
  initializeFromQuery();

  return {
    // Reactive state
    filters,
    
    // Computed properties
    hasActiveFilters,
    hasCustomSort,
    hasActiveSearch,
    
    // Update methods
    updateFilters,
    updateSort,
    updateSearch,
    updatePage,
    updateUrl,
    
    // Reset methods
    clearFilters,
    clearFilterOptions,
    
    // Utility methods
    initializeFromQuery,
    parseQueryToFilters,
    filtersToQuery,
  };
};
