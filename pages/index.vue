<template>
  <div class="p-4 space-y-4">
    <UAlert
      v-if="successMessage"
      :description="successMessage"
      color="success"
      icon="i-heroicons-check-circle"
      class="mb-4"
    />

    <SearchHeader
      :is-searching="isSearching"
      :search-query="searchQuery"
      :available-categories="availableCategories"
      @clear-search="clearSearch"
    />

    <SearchResults
      :is-searching="isSearching"
      :search-query="searchQuery"
      :filtered-locations="filteredLocations"
      @clear-search="clearSearch"
    />

    <LocationsTable
      :is-searching="isSearching"
      :filtered-locations="sortedLocations"
      :paginated-locations="paginatedLocations"
      :current-page="currentPage"
      :total-items="totalItems"
      :items-per-page="itemsPerPage"
      @remove-location="removeLocation"
      @update:current-page="currentPage = $event"
    />
  </div>
</template>

<script setup lang="ts">
import type { Database, Tables } from '~/types/supabase';
import type { LocationFromDB, ProcessedLocation } from '~/types/location';
import type { PostgrestError } from '@supabase/supabase-js';

interface LocationWithRelations extends Omit<Tables<'location'>, 'description' | 'user_id'> {
  categories: { name: string };
  photos: { photo_url: string; is_main: boolean | null }[];
}

interface PostgresError extends PostgrestError {
  status?: unknown;
}

/**
 * Use query filters composable for centralized state management
 */
const { filters, updatePage } = useQueryFilters();

/**
 * Computed properties from filters
 */
const searchQuery = computed(() => filters.search || '');
const isSearching = computed(() => !!searchQuery.value);
const sortBy = computed(() => filters.sortBy as 'name' | 'location' | 'created_at');
const sortDirection = computed(() => filters.sortDirection);

/**
 * Route and router for success message handling
 */
const route = useRoute();
const router = useRouter();

/**
 * Supabase client instance
 */
const supabase = useSupabaseClient<Database>();

/**
 * Fetch location data
 */
const { data: rawLocations, error } = await useLazyAsyncData<
  LocationWithRelations[],
  PostgresError
>(
  'locations', // Static key, but watch will handle reactivity
  async () => {
    const query = searchQuery.value.toLowerCase().trim().split(',')[0];
    const { data, error } = await supabase
      .from('location')
      .select(
        `
      id,
      name,
      location,
      category_id,
      map_url,
      web_url,
      instagram_url,
      facebook_url,
      youtube_url,
      visited,
      created_at,
      categories (
        name
      ),
      photos (
        photo_url,
        is_main
      )
    `
      )
      .or(`name.ilike.%${query}%,location.ilike.%${query}%`)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
  {
    watch: [searchQuery],
  }
);

if (error.value) {
  const message = import.meta.dev
    ? `Chyba při načítání lokalit: ${error.value.message}`
    : 'Došlo k chybě při načítání lokalit. Zkuste to prosím znovu později.';

  throw createError({
    statusCode: (error.value.status as number) || 500,
    message,
  });
}

/**
 * Success message handling
 */
const successMessage = ref('');

onMounted(() => {
  const success = route.query.success as string;
  if (success) {
    successMessage.value = decodeURIComponent(success);
    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
    router.replace({ query: {} });
  }
});

/**
 * Process location data
 */
const allLocations = computed(() => {
  if (!rawLocations.value) return [];

  return rawLocations.value.map(
    (loc: LocationFromDB): ProcessedLocation => ({
      ...loc,
      category_name: loc.categories?.name || 'Neznámá kategorie',
      main_photo_url: loc.photos?.find((p) => p.is_main)?.photo_url ?? null,
      photos: loc.photos
        ? loc.photos.map((p) => ({
            photo_url: p.photo_url,
            is_main: !!p.is_main,
          }))
        : undefined,
    })
  );
});

/**
 * Get available categories from data
 */
const availableCategories = computed(() => {
  const categories = new Set<string>();
  allLocations.value.forEach((location) => {
    if (location.category_name && location.category_name !== 'Neznámá kategorie') {
      categories.add(location.category_name);
    }
  });
  return Array.from(categories).sort();
});

/**
 * Filter locations based on search and filters
 */
const filteredLocations = computed(() => {
  let locations = allLocations.value;

  // Apply search filter
  if (isSearching.value && searchQuery.value) {
    // Keep all results when searching - search is handled by the query
  }

  // Apply category filter
  if (filters.category) {
    locations = locations.filter((loc) => loc.category_name === filters.category);
  }

  // Apply visited filter
  if (filters.visited !== null) {
    locations = locations.filter((loc) => loc.visited === filters.visited);
  }

  // Apply photos filter
  if (filters.hasPhotos !== null) {
    locations = locations.filter((loc) => {
      const hasPhotos = loc.photos && loc.photos.length > 0;
      return hasPhotos === filters.hasPhotos;
    });
  }

  // Apply links filter
  if (filters.hasLinks !== null) {
    locations = locations.filter((loc) => {
      const hasLinks = !!(loc.web_url || loc.instagram_url || loc.facebook_url || loc.youtube_url);
      return hasLinks === filters.hasLinks;
    });
  }

  return locations;
});

/**
 * Sort locations based on selected criteria
 */
const sortedLocations = computed(() => {
  const locations = [...filteredLocations.value];

  return locations.sort((a, b) => {
    let comparison = 0;

    switch (sortBy.value) {
      case 'name':
        comparison = a.name.localeCompare(b.name, 'cs');
        break;
      case 'location':
        comparison = a.location.localeCompare(b.location, 'cs');
        break;
      case 'created_at': {
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        comparison = dateA - dateB;
        break;
      }
    }

    return sortDirection.value === 'asc' ? comparison : -comparison;
  });
});

/**
 * Pagination
 */
const {
  currentPage,
  totalItems,
  paginatedData: paginatedLocations,
  itemsPerPage,
} = usePagination(sortedLocations, 10);

/**
 * Pagination sync with URL
 */
watch(currentPage, (newPage) => {
  if (newPage !== filters.page) {
    updatePage({ page: newPage });
  }
});

watch(
  () => filters.page,
  (newPage) => {
    if (newPage !== currentPage.value) {
      currentPage.value = newPage;
    }
  }
);

/**
 * Clear search
 */
function clearSearch() {
  const { updateSearch } = useQueryFilters();
  updateSearch({ search: null });
}

/**
 * Remove location
 */
async function removeLocation(id: string, title: string) {
  const { success: locationWasRemoved, error } = await useLocationRemove(id, title);

  if (locationWasRemoved) {
    if (rawLocations.value) {
      rawLocations.value = rawLocations.value.filter((location) => location.id !== id);
    }

    successMessage.value = `Lokalita "${title}" byla úspěšně smazána.`;

    setTimeout(() => {
      successMessage.value = '';
    }, 5000);
  } else if (error) {
    throw createError({
      statusCode: 500,
      message: error,
    });
  }
}
</script>
