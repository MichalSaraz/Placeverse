<template>
  <UPage>
    <template v-if="data">
      <UPageBody>
        <UContainer>
          <h1 class="text-3xl font-black tracking-tight text-center mb-6 mt-8">{{ data.name }}</h1>
          <section class="space-y-4">
            <p class="text-gray-600 italic dark:text-gray-300 mt-4 mb-8 text-justify">
              {{ data.description }}
            </p>

            <div class="flex gap-8 items-start">
              <div
                v-if="mainPhoto"
                class="flex-shrink-0 w-80 max-w-full border rounded overflow-hidden bg-white dark:bg-slate-900 shadow"
              >
                <img
                  :src="mainPhoto.photo_url"
                  alt="Hlavní fotka"
                  class="w-full h-auto object-cover"
                />
              </div>
              <div class="flex-1 space-y-4">
                <div class="flex items-center gap-4">
                  <span class="font-semibold">Poloha:</span>
                  <span>{{ data.location }}</span>
                </div>
                <div v-for="link in infoLinks" :key="link.key" class="flex items-center gap-4">
                  <span class="font-semibold">{{ link.label }}:</span>
                  <span v-if="data[link.key]">
                    <a :href="data[link.key]" target="_blank" class="text-sky-600 hover:underline">
                      {{ link.text || data[link.key] }}
                    </a>
                  </span>
                  <span v-else class="text-gray-400">neuvedeno</span>
                </div>
                <div class="flex items-center gap-4">
                  <span class="font-semibold">Navštíveno:</span>
                  <span
                    :class="
                      data.visited ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'
                    "
                  >
                    {{ data.visited ? 'ano' : 'ne' }}
                  </span>
                </div>
              </div>
            </div>

            <div v-if="otherPhotos.length" class="mt-6">
              <UCarousel
                v-slot="{ item }"
                arrows
                dots
                :items="otherPhotos"
                :ui="{ item: 'basis-1/3 px-2' }"
              >
                <img
                  :src="item.photo_url"
                  class="rounded-lg w-full h-64 object-cover"
                  :alt="'Photo'"
                />
              </UCarousel>
            </div>
          </section>
          <div class="text-gray-600 dark:text-gray-400 flex justify-between mt-8">
            <p class="text-xs">
              Vytvořeno:
              <UBadge variant="subtle" color="neutral">
                {{ new Date(data.created_at).toLocaleDateString() }}
              </UBadge>
            </p>
            <p class="text-xs">
              Kategorie:
              <UBadge variant="subtle" color="info">{{ data.categories.name }}</UBadge>
            </p>
          </div>
        </UContainer>
      </UPageBody>
    </template>
    <template v-else-if="error">
      <div class="p-6 text-red-600">
        Chyba při načítání lokality: {{ error.statusMessage || 'Neznámá chyba' }}
      </div>
    </template>
    <template v-else>
      <div class="p-6 text-gray-600 dark:text-gray-300">Načítání...</div>
    </template>
  </UPage>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

/**
 * Retrieves the current route object using Vue Router's `useRoute` composable.
 * This provides access to route parameters, query, and other route-related information.
 */
const route = useRoute();

/**
 * Extracts the 'id' parameter from the current route and asserts its type as a string.
 */
const id = route.params.id as string;

/**
 * Supabase client instance for interacting with the database.
 */
const supabase = useSupabaseClient();

/**
 * Asynchronously fetches location data from the Supabase database based on the provided 'id'.
 * Utilizes the `useAsyncData` composable to manage loading and error states.
 */
const { data, error } = await useAsyncData(`location:${id}`, async () => {
  const { data, error } = await supabase
    .from('location')
    .select('*, photos(is_main, photo_url), categories(name)')
    .eq('id', id)
    .single();

  if (error || !data) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Location not found',
    });
  }
  return data;
});

/**
 * Computes the main photo from the fetched location data.
 * If no main photo is marked, it defaults to the first photo in the list.
 */
const mainPhoto = computed(() => {
  if (!data.value?.photos?.length) {
    return null;
  }
  return data.value.photos.find((p) => p.is_main) || data.value.photos[0];
});

/**
 * Computes the list of other photos excluding the main photo.
 * If no main photo is marked, it excludes the first photo in the list.
 */
const otherPhotos = computed(() => {
  if (!data.value?.photos?.length) {
    return [];
  }
  const mainIndex = data.value.photos.findIndex((p) => p.is_main);
  return data.value.photos.filter((p, i) => (mainIndex !== -1 ? !p.is_main : i !== 0));
});

/**
 * An array of informational links related to the location.
 * Each object contains a label, key, and optional text for display.
 */
const infoLinks = [
  { label: 'Mapa', key: 'map_url', text: 'zobrazit mapu' },
  { label: 'Web', key: 'web_url' },
  { label: 'Facebook', key: 'facebook_url' },
  { label: 'Instagram', key: 'instagram_url' },
  { label: 'Youtube', key: 'youtube_url' },
];

if (error.value) {
  throw createError({
    ...error.value,
  });
}
</script>
