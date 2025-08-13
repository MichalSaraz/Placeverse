<template>
  <div class="p-4 space-y-4">
    <div class="flex justify-between items-center">
      <h1 class="text-2xl font-bold">Moje lokality</h1>
      <UButton icon="i-heroicons-plus" @click="navigateTo('/location/add')">
        Přidat lokalitu
      </UButton>
    </div>

    <UAlert
      v-if="successMessage"
      color="success"
      icon="i-heroicons-check-circle"
      :description="successMessage"
      class="mb-4"
    />

    <UTable
      :data="locations"
      :columns="columns"
      class="w-full striped-table"
      :ui="{
        tbody: 'divide-y divide-gray-200',
        tr: '',
        td: 'whitespace-nowrap px-3 py-1.5 text-sm',
      }"
    >
      <template #main_photo_url-cell="{ getValue }">
        <UAvatar
          :src="getValue() || '/placeholder.png'"
          alt="Náhled"
          size="md"
        />
      </template>

      <template #map_url-cell="{ getValue }">
        <template v-if="!getValue()">—</template>
        <template v-else>
          <a
            :href="getValue()"
            target="_blank"
            :class="getMapLinkClasses(getValue())"
            :title="getMapLinkTitle(getValue())"
          >
            <UIcon
              name="i-heroicons-map-pin"
              :class="getMapIconClasses(getValue())"
            />
            {{ getMapLinkText(getValue()) }}
          </a>
        </template>
      </template>

      <template #visited-cell="{ getValue }">
        <UIcon
          :name="
            getValue()
              ? 'i-heroicons-check-circle-20-solid'
              : 'i-heroicons-x-circle-20-solid'
          "
          :class="getValue() ? 'text-green-500' : 'text-gray-400'"
          style="width: 19px; height: 19px; font-size: 19px"
        />
      </template>

      <template #web_url-cell="{ row }">
        <div class="flex space-x-2">
          <template
            v-for="link in getSocialLinks(row.original)"
            :key="link.key"
          >
            <a
              v-if="link.url"
              :href="link.url"
              target="_blank"
              class="text-blue-500 hover:text-blue-700 cursor-pointer"
              :title="link.title"
            >
              <UIcon :name="link.icon" class="w-5 h-5" />
            </a>
            <div
              v-else
              class="text-gray-400"
              :title="`${link.title} - není k dispozici`"
            >
              <UIcon :name="link.icon" class="w-5 h-5" />
            </div>
          </template>
        </div>
      </template>
    </UTable>
  </div>
</template>

<script setup lang="ts">
import type { ColumnDef } from '#ui/types';
import { UAvatar, UIcon } from '#components';
import type { Database } from '~/types/supabase';
import type { LocationFromDB, ProcessedLocation } from '~/types/location';
import { extractCoordinatesFromUrl } from '~/utils/mapUtils';

/**
 * Supabase client instance for authentication
 */
const supabase = useSupabaseClient<Database>();

/**
 * Fetches location data asynchronously using useLazyAsyncData.
 * - `rawLocations`: The fetched location data.
 * - `error`: Any error encountered during the fetch operation.
 */
const { data: rawLocations, error } = await useLazyAsyncData(
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
    statusCode: error.value.status || 500,
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
 * ✅ Added proper TypeScript types with ColumnDef<ProcessedLocation>[]
 * ✅ Converted from cell render functions to Vue template slots
 */
const columns: ColumnDef<ProcessedLocation>[] = [
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
 * Returns a string of CSS classes for a map link based on the provided URL.
 *
 * @param {string} url - The URL to evaluate for generating map link classes.
 * @returns {string} The CSS class names to apply to the map link.
 */
function getMapLinkClasses(url: string): string {
  const coords = extractCoordinatesFromUrl(url);
  return coords
    ? [
        'inline-flex items-center px-2 py-0.5',
        'bg-blue-50 hover:bg-blue-100 text-blue-700',
        'rounded border border-blue-200',
        'transition-colors cursor-pointer text-xs',
      ].join(' ')
    : 'text-blue-500 underline hover:text-blue-700 flex items-center text-xs';
}

/**
 * Returns a string of CSS classes for the map icon based on the provided URL.
 *
 * @param {string} url - The URL to evaluate for generating map icon classes.
 * @returns {string} The CSS class names to apply to the map icon.
 */
function getMapIconClasses(url: string): string {
  const coords = extractCoordinatesFromUrl(url);
  return coords ? 'w-3 h-3 mr-1 text-red-500' : 'w-3 h-3 mr-1';
}

/**
 * Helper function to get map link text based on URL
 */
function getMapLinkText(url: string): string {
  const coords = extractCoordinatesFromUrl(url);
  return coords ? 'Zobrazit mapu' : 'Otevřít mapu';
}

/**
 * Helper function to get the title for the map link based on URL
 * - If coordinates are present, formats them to 4 decimal places
 * - Otherwise, returns a generic title
 *
 * @param {string} url - The URL to extract coordinates from
 * @returns {string} The formatted title for the map link
 */
function getMapLinkTitle(url: string): string {
  const coords = extractCoordinatesFromUrl(url);
  return coords
    ? `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(
        4
      )} - Klikněte pro otevření`
    : 'Klikněte pro otevření mapy';
}

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

<style scoped>
/**
 * Table styling for alternating row colors and hover effects.
 * Using !important to override Nuxt UI default styles.
 */

/* Even rows - light gray background */
.striped-table :deep(tbody tr:nth-child(even)) {
  background-color: #f8fafc !important;
}

/* Odd rows - white background */
.striped-table :deep(tbody tr:nth-child(odd)) {
  background-color: #ffffff !important;
}

/* Hover effect - subtle blue-gray background with smooth transition */
.striped-table :deep(tbody tr:hover) {
  background-color: #e2e8f0 !important;
  transition: background-color 0.15s ease-in-out;
}

/* Compact table cells - reduced vertical padding for denser layout */
.striped-table :deep(td) {
  padding-top: 0.375rem !important;
  padding-bottom: 0.375rem !important;
}
</style>
