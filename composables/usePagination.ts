/**
 * Simple client-side pagination for data
 * 
 * @param data Reactive data for pagination
 * @param itemsPerPage Number of items per page (default: 10)
 * @returns Object with pagination data and functions
 */
export function usePagination<T>(data: Ref<T[]>, itemsPerPage = 10) {
  const currentPage = ref(1);
  
  const totalItems = computed(() => data.value?.length || 0);
  
  const paginatedData = computed(() => {
    if (!data.value || data.value.length === 0) return [];
    
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    
    return data.value.slice(start, end);
  });

  watch(data, () => {
    currentPage.value = 1;
  });

  return {
    currentPage,
    totalItems,
    paginatedData,
    itemsPerPage
  };
}
