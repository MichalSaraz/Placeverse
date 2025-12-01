<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Moje lokality</h1>
      <UButton icon="i-heroicons-plus" to="/location/add">Přidat lokalitu</UButton>
    </div>

    <UAlert
      v-if="successMessage"
      :description="successMessage"
      color="success"
      icon="i-heroicons-check-circle"
      class="mb-4"
    />

    <UTable
      :data="paginatedLocations"
      :columns="columns"
      class="w-full"
      :ui="{
        td: 'px-2 py-2 text-sm',
        th: 'px-2 py-2 text-sm font-medium',
      }"
      @select="() => {}"
    >
      <template #main_photo_url-cell="{ row }">
        <nuxt-link :to="`/location/${row.original.id}`">
          <UAvatar :src="row.original.main_photo_url || ''" :alt="row.original.name" size="md" />
        </nuxt-link>
      </template>

      <template #name-cell="{ row }">
        <UTooltip :text="row.original.name">
          <nuxt-link :to="`/location/${row.original.id}`" class="hover:underline">
            {{ shortenString(row.original.name) }}
          </nuxt-link>
        </UTooltip>
      </template>

      <template #location-cell="{ row }">
        <div class="flex gap-x-2 items-center">
          <div v-if="row.original.map_url">
            <ShowMapButton :url="row.original.map_url" />
          </div>
          <UTooltip :text="row.original.location">
            <span>{{ shortenString(row.original.location) }}</span>
          </UTooltip>
        </div>
      </template>

      <template #visited-cell="{ row }">
        <div class="flex justify-center">
          <VisitedIndicator :visited="row.original.visited" />
        </div>
      </template>

      <template #web_url-cell="{ row }">
        <div class="flex space-x-2">
          <template v-for="link in getSocialLinks(row.original)" :key="link.key">
            <UButton
              v-if="link.url"
              :href="link.url"
              target="_blank"
              :icon="link.icon"
              :title="link.title"
              variant="soft"
              size="sm"
              color="secondary"
            ></UButton>
          </template>
        </div>
      </template>
      <template #actions-cell="{ row }">
        <div class="flex gap-x-2">
          <UTooltip text="Zobrazit detail">
            <UButton
              :to="`/location/${row.original.id}`"
              icon="i-heroicons-eye"
              size="sm"
              color="secondary"
              variant="outline"
            />
          </UTooltip>
          <UTooltip text="Upravit lokalitu">
            <UButton
              :to="`/location/edit/${row.original.id}`"
              icon="i-heroicons-pencil"
              size="sm"
              color="warning"
              variant="outline"
            />
          </UTooltip>
          <UTooltip text="Smazat lokalitu">
            <UButton
              icon="i-heroicons-trash"
              size="sm"
              color="error"
              variant="outline"
              @click="removeLocation(row.original.id, row.original.name)"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>

    <div v-if="totalItems > itemsPerPage" class="mt-6 flex justify-center">
      <UPagination v-model:page="currentPage" :total="totalItems" :items-per-page="itemsPerPage" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { Database, Tables } from '~/types/supabase';
import type { LocationFromDB, ProcessedLocation } from '~/types/location';
import type { PostgrestError } from '@supabase/supabase-js';
import { getResourceIconAndTitle } from '~/utils/getResourceIconAndTitle';

interface LocationWithRelations
  extends Omit<Tables<'location'>, 'created_at' | 'description' | 'user_id'> {
  categories: { name: string };
  photos: { photo_url: string; is_main: boolean | null }[];
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
const { data: rawLocations, error } = await useLazyAsyncData<
  LocationWithRelations[],
  PostgresError
>('locations', async () => {
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
});

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
 * Pagination for locations
 */
const {
  currentPage,
  totalItems,
  paginatedData: paginatedLocations,
  itemsPerPage,
} = usePagination(allLocations, 10);

/**
 * Table columns configuration for the locations table.
 * Using slot-based rendering for better flexibility and maintainability.
 * Added proper TypeScript types with ColumnDef<ProcessedLocation>[]
 * Converted from cell render functions to Vue template slots
 */
const columns: TableColumn<ProcessedLocation>[] = [
  {
    accessorKey: 'main_photo_url',
    header: 'Foto',
  },
  {
    accessorKey: 'name',
    header: 'Název',
  },
  {
    accessorKey: 'location',
    header: 'Lokalita',
  },
  {
    accessorKey: 'category_name',
    header: 'Kategorie',
  },
  {
    accessorKey: 'visited',
    header: 'Navštíveno',
  },
  {
    accessorKey: 'web_url',
    header: 'Odkazy',
  },
  {
    accessorKey: 'actions',
    header: 'Akce',
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
      ...getResourceIconAndTitle('web'),
    },
    {
      key: 'facebook',
      url: row.facebook_url,
      ...getResourceIconAndTitle('facebook'),
    },
    {
      key: 'instagram',
      url: row.instagram_url,
      ...getResourceIconAndTitle('instagram'),
    },
    {
      key: 'youtube',
      url: row.youtube_url,
      ...getResourceIconAndTitle('youtube'),
    },
  ];
}

/**
 * Remove a location with confirmation and immediate UI update.
 *
 * @param {string} id - The location ID to remove
 * @param {string} title - The location title for display in confirmation
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
