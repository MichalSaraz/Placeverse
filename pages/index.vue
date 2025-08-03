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
        td: 'whitespace-nowrap px-3 py-1.5 text-sm'
      }"
    />
  </div>
</template>

<script setup lang="ts">
import { h } from 'vue';
import { UAvatar, UIcon } from '#components';
import type { Database } from '~/types/supabase';
import type { LocationFromDB, ProcessedLocation, TableRow } from '~/types/location';
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
    const { data } = await supabase
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

    return data || [];
  }
);

/**
 * Logs errors during development for debugging purposes
 */
const logError = () => {
  if (import.meta.dev && error.value) {
    console.error('Chyba při načítání lokalit:', error.value);
  }
};

/**
 * Reactivity to log errors whenever the error state changes.
 */
watchEffect(logError);

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
 * Each column defines how data is displayed and rendered.
 */
const columns = [
  // Photo column - displays main location photo
  {
    accessorKey: 'main_photo_url',
    header: '',
    cell: ({ row }: { row: TableRow }) => {
      const url = row.getValue('main_photo_url') as string;
      const fallback = '/placeholder.png';
      return h(UAvatar, {
        src: url || fallback,
        alt: 'Náhled',
        size: 'md',
      });
    },
  },
  
  // Basic text columns
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
  
  // Map column - displays interactive map button with coordinates
  {
    accessorKey: 'map_url',
    header: 'Mapa',
    cell: ({ row }: { row: TableRow }) => {
      const url = row.getValue('map_url') as string;
      if (!url) return '—';

      const coords = extractCoordinatesFromUrl(url);

      if (coords) {
        return h(
          'a',
          {
            href: url,
            target: '_blank',
            class: [
              'inline-flex items-center px-2 py-0.5',
              'bg-blue-50 hover:bg-blue-100 text-blue-700',
              'rounded border border-blue-200',
              'transition-colors cursor-pointer text-xs'
            ].join(' '),
            title: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(
              4
            )} - Klikněte pro otevření`,
          },
          [
            h(UIcon, {
              name: 'i-heroicons-map-pin',
              class: 'w-3 h-3 mr-1 text-red-500',
            }),
            'Zobrazit mapu',
          ]
        );
      } else {
        return h(
          'a',
          {
            href: url,
            target: '_blank',
            class:
              'text-blue-500 underline hover:text-blue-700 flex items-center text-xs',
          },
          [
            h(UIcon, { name: 'i-heroicons-map-pin', class: 'w-3 h-3 mr-1' }),
            'Otevřít mapu',
          ]
        );
      }
    },
  },
  
  // Visited status column - displays checkmark icon
  {
    accessorKey: 'visited',
    header: 'Navštíveno',
    cell: ({ row }: { row: TableRow }) => {
      const visited = row.getValue('visited') as boolean;
      return h(UIcon, {
        name: visited
          ? 'i-heroicons-check-circle-20-solid'
          : 'i-heroicons-x-circle-20-solid',
        class: visited ? 'text-green-500' : 'text-gray-400',
        style: 'width: 19px; height: 19px; font-size: 19px;',
      });
    },
  },
  
  // Social links column - displays icons for web, facebook, instagram, youtube
  {
    accessorKey: 'web_url',
    header: 'Odkazy',
    cell: ({ row }: { row: TableRow }) => {
      const links = {
        web: { url: row.original.web_url, icon: 'i-heroicons-globe-alt' },
        facebook: {
          url: row.original.facebook_url,
          icon: 'i-simple-icons-facebook',
        },
        instagram: {
          url: row.original.instagram_url,
          icon: 'i-simple-icons-instagram',
        },
        youtube: {
          url: row.original.youtube_url,
          icon: 'i-simple-icons-youtube',
        },
      };

      return h(
        'div',
        { class: 'flex space-x-2' },
        Object.entries(links).map(([key, { url, icon }]) =>
          url
            ? h(
                'a',
                {
                  href: url,
                  target: '_blank',
                  class: 'text-blue-500 hover:text-blue-700 cursor-pointer',
                  title: key === 'web' ? 'Webová stránka' : key,
                },
                [h(UIcon, { name: icon, class: 'w-5 h-5' })]
              )
            : h(
                'div',
                {
                  class: 'text-gray-400',
                  title: `${
                    key === 'web' ? 'Webová stránka' : key
                  } - není k dispozici`,
                },
                [h(UIcon, { name: icon, class: 'w-5 h-5' })]
              )
        )
      );
    },
  },
];
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
