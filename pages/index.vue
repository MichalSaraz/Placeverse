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
      :filtered-locations="filteredLocations"
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

interface LocationWithRelations
  extends Omit<Tables<'location'>, 'created_at' | 'description' | 'user_id'> {
  categories: { name: string };
  photos: { photo_url: string; is_main: boolean | null }[];
}

interface PostgresError extends PostgrestError {
  status?: unknown;
}

/**
 * Route and search functionality
 */
const route = useRoute();
const router = useRouter();
const searchQuery = computed(() => (route.query.q as string) || '');
const isSearching = computed(() => !!searchQuery.value);

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
  'locations',
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
 * Filter locations based on search
 */
const filteredLocations = computed(() => {
  if (!isSearching.value || !searchQuery.value) {
    return allLocations.value;
  }

  // const query = searchQuery.value.toLowerCase();
  // return allLocations.value.filter(
  //   (location) =>
  //     location.name.toLowerCase().includes(query) || location.location.toLowerCase().includes(query)
  // );
  return allLocations.value;
});

/**
 * Pagination
 */
const {
  currentPage,
  totalItems,
  paginatedData: paginatedLocations,
  itemsPerPage,
} = usePagination(filteredLocations, 10);

/**
 * Clear search
 */
function clearSearch() {
  router.push('/');
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
