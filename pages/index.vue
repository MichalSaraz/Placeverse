<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Moje lokality</h1>
      <UButton icon="i-heroicons-plus" to="/location/add">
        Přidat lokalitu
      </UButton>
    </div>

    <UAlert v-if="successMessage" :description="successMessage" color="success" icon="i-heroicons-check-circle"
      class="mb-4" />

    <UTable :data="locations" :columns="columns" class="w-full" @select="() => { }">
      <template #main_photo_url-cell="{ row }">
        <UAvatar :src="row.original.main_photo_url || ''" :alt="row.original.name" size="md" />
      </template>

      <template #map_url-cell="{ row }">
        <template v-if="!row.original.map_url">—</template>
        <template v-else>
          <ShowMapButton :url="row.original.map_url" />
        </template>
      </template>

      <template #visited-cell="{ row }">
        <VisitedIndicator :visited="row.original.visited" />
      </template>

      <template #web_url-cell="{ row }">
        <div class="flex space-x-2">
          <template v-for="link in getSocialLinks(row.original)" :key="link.key">
            <a v-if="link.url" :href="link.url" target="_blank" class="text-blue-500 hover:text-blue-700 cursor-pointer"
              :title="link.title">
              <UIcon :name="link.icon" class="w-5 h-5" />
            </a>
            <div v-else class="text-gray-400" :title="`${link.title} - není k dispozici`">
              <UIcon :name="link.icon" class="w-5 h-5" />
            </div>
          </template>
        </div>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Database, Tables } from '~/types/supabase';
import type { LocationFromDB, ProcessedLocation } from '~/types/location';
import type { PostgrestError } from '@supabase/supabase-js';

interface LocationWithRelations extends Omit<Tables<'location'>, 'created_at' | 'description' | 'user_id'> {
  categories: { name: string };
  photos: { photo_url: string, is_main: boolean | null }[];
}

interface PostgresError extends PostgrestError {
  status?: unknown;
}

/**
 * Supabase client instance for authentication
 */
const supabase = useSupabaseClient<Database>();

/**
 * Fetches location data asynchronously using useLazyAsyncData.
 * - `rawLocations`: The fetched location data.
 * - `error`: Any error encountered during the fetch operation.
 */
const { data: rawLocations, error } = await useLazyAsyncData<LocationWithRelations[], PostgresError>(
  'locations',
  async () => {
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
      .order('name', { ascending: true });

    if (error) throw error;

    return data || [];
  }
);

if (error.value) {
  const message = import.meta.dev
    ? `Chyba při načítání lokalit: ${error.value.message}`
    : 'Došlo k chybě při načítání lokalit. Zkuste to prosím znovu později.';

  throw createError({
    statusCode: error.value.status as number || 500,
    message,
  });
}

/**
 * Success message handling for redirect from add page
 */
const route = useRoute();
const successMessage = ref('');

/**
 * On component mount, check for success query parameter in the route.
 * If present, decode and display the success message, then clear it after 5 seconds.
 */
onMounted(() => {
  const success = route.query.success as string;
  if (success) {
    successMessage.value = decodeURIComponent(success);

    setTimeout(() => {
      successMessage.value = '';
    }, 5000);

    const router = useRouter();
    router.replace({ query: {} });
  }
});

/**
 * Computed property to process raw location data into a more usable format.
 * - Maps each location to include category name and main photo URL.
 */
const locations = computed(() => {
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
 * Table columns configuration for the locations table.
 * Using slot-based rendering for better flexibility and maintainability.
 * Added proper TypeScript types with ColumnDef<ProcessedLocation>[]
 * Converted from cell render functions to Vue template slots
 */
const columns: TableColumn<ProcessedLocation>[] = [
  {
    accessorKey: 'main_photo_url',
    header: '',
  },
  {
    accessorKey: 'name',
    header: 'Název',
  },
  {
    accessorKey: 'location',
    header: 'Místo',
  },
  {
    accessorKey: 'category_name',
    header: 'Kategorie',
  },
  {
    accessorKey: 'map_url',
    header: 'Mapa',
  },
  {
    accessorKey: 'visited',
    header: 'Navštíveno',
  },
  {
    accessorKey: 'web_url',
    header: 'Odkazy',
  },
];


/**
 * Returns an array of social links for a given location row.
 * - Each link includes a key, URL, icon, and title.
 *
 * @param {ProcessedLocation} row - The location data row to extract social links from.
 * @returns {Array} An array of social link objects.
 */
function getSocialLinks(row: ProcessedLocation) {
  return [
    {
      key: 'web',
      url: row.web_url,
      icon: 'i-heroicons-globe-alt',
      title: 'Webová stránka',
    },
    {
      key: 'facebook',
      url: row.facebook_url,
      icon: 'i-simple-icons-facebook',
      title: 'Facebook',
    },
    {
      key: 'instagram',
      url: row.instagram_url,
      icon: 'i-simple-icons-instagram',
      title: 'Instagram',
    },
    {
      key: 'youtube',
      url: row.youtube_url,
      icon: 'i-simple-icons-youtube',
      title: 'YouTube',
    },
  ];
}
</script>
