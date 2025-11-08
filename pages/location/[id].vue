<template v-if="data">
  <UContainer>
    <h1 class="mt-8 mb-6 text-3xl font-black tracking-tight text-center">{{ data.name }}</h1>
    <section class="space-y-4">
      <p class="mt-4 mb-8 italic text-justify text-gray-600 dark:text-gray-300">
        {{ data.description }}
      </p>

      <div class="flex items-start gap-8">
        <div
          v-if="mainPhoto"
          class="flex-shrink-0 max-w-full overflow-hidden bg-white border rounded shadow w-80 dark:bg-slate-900"
        >
          <img :src="mainPhoto.photo_url" alt="Hlavní fotka" class="object-cover w-full h-auto" />
        </div>
        <div class="flex-1 space-y-4">
          <div class="flex items-center gap-4">
            <UIcon :name="getResourceIconAndTitle('location').icon" class="w-5 h-5" />
            <span class="font-semibold">Poloha:</span>
            <span>{{ data.location }}</span>
          </div>
          <template v-for="link in infoLinks" :key="link.key">
            <div v-if="data[link.key]" class="flex items-center gap-4">
              <UIcon :name="link.icon" class="w-5 h-5" />
              <span class="font-semibold">{{ link.title }}:</span>
              <a :href="data[link.key]" target="_blank" class="text-sky-600 hover:underline">
                {{ link.text || data[link.key] }}
              </a>
            </div>
          </template>
          <div class="flex items-center gap-4">
            <UIcon :name="getResourceIconAndTitle('visited').icon" class="w-5 h-5" />
            <span class="font-semibold">Navštíveno:</span>
            <span
              :class="data.visited ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'"
            >
              {{ data.visited ? 'ano' : 'ne' }}
            </span>
          </div>
        </div>
      </div>

      <div v-if="otherPhotos.length" class="mt-6">
        <div
          ref="carouselWrapper"
          data-carousel
          class="relative group"
          @mouseenter="updateEditButtonPosition"
        >
          <UCarousel
            v-slot="{ item }"
            arrows
            dots
            :items="otherPhotos"
            :ui="{ item: 'basis-1/3 px-2' }"
          >
            <img :src="item.photo_url" class="object-cover w-full h-64 rounded-lg" :alt="'Photo'" />
          </UCarousel>

          <div
            class="absolute z-20 transition-opacity opacity-0 group-hover:opacity-100"
            :style="editButtonStyle"
          >
            <UTooltip text="Upravit galerii">
              <UButton
                type="button"
                size="sm"
                variant="subtle"
                color="warning"
                class="flex items-center justify-center p-0 transition-colors rounded-md cursor-pointer w-9 h-9 bg-white/95 dark:bg-slate-800/95 hover:bg-white/70 dark:hover:bg-slate-800/70"
                aria-label="Upravit galerii"
                @click="showGalleryModal = true"
              >
                <UIcon name="i-lucide-edit-2" class="w-4 h-4" />
              </UButton>
            </UTooltip>
          </div>

          <MountedTeleport v-if="showGalleryModal">
            <div
              class="fixed inset-0 z-50 flex items-center justify-center"
              role="dialog"
              aria-modal="true"
            >
              <div class="absolute inset-0 bg-black/50" @click="tryCloseGallery"></div>
              <div
                class="relative z-10 w-full max-w-4xl p-4 mx-4 bg-white rounded-lg shadow-lg dark:bg-slate-900"
              >
                <div class="flex items-center justify-between mb-4">
                  <h3 class="text-lg font-semibold">Upravit galerii</h3>
                  <UButton
                    size="sm"
                    variant="ghost"
                    class="cursor-pointer"
                    @click="tryCloseGallery"
                  >
                    Zavřít
                  </UButton>
                </div>
                <div class="max-h-[70vh] overflow-auto">
                  <GalleryEditor ref="galleryRef" :location-id="id" @saved="onGallerySaved" />
                </div>
              </div>
            </div>
          </MountedTeleport>
        </div>
      </div>
    </section>
    <div class="flex justify-between mt-8 text-gray-600 dark:text-gray-400">
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
</template>

<script setup lang="ts">
import { getResourceIconAndTitle } from '~/utils/getResourceIconAndTitle';
import GalleryEditor from '~/components/gallery-editor.vue';

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
const supabase = useSupabaseClient<Database>();

/**
 * Asynchronously fetches location data from the Supabase database based on the provided 'id'.
 * Utilizes the `useAsyncData` composable to manage loading and error states.
 */
const { data, error, refresh } = await useAsyncData(`location:${id}`, async () => {
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
  if (!data.value?.photos?.length) return null;

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
const infoLinks = computed(() => [
  { key: 'map_url', text: 'zobrazit mapu', ...getResourceIconAndTitle('map') },
  { key: 'web_url', ...getResourceIconAndTitle('web') },
  { key: 'facebook_url', ...getResourceIconAndTitle('facebook') },
  { key: 'instagram_url', ...getResourceIconAndTitle('instagram') },
  { key: 'youtube_url', ...getResourceIconAndTitle('youtube') },
]);

if (error.value) {
  throw createError({
    ...error.value,
  });
}

/**
 * Modal state for gallery edit overlay
 */
const showGalleryModal = ref(false);

/**
 * ref to the GalleryEditor component instance so we can requestClose before closing modal
 */
const galleryRef = ref<null | { requestClose?: () => Promise<boolean> }>(null);

/**
 * ref to carousel wrapper for computing button position
 */
const carouselWrapper = ref<HTMLElement | null>(null);

/**
 * Style object for positioning the edit button dynamically
 */
const editButtonStyle = ref<Record<'top' | 'right', string>>({ top: '0px', right: '0px' });

/**
 * debounce timer used both for resize and mouseenter scheduling
 */
let updateTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Updates the position of the edit button to align with the right-most visible image in the carousel.
 */
async function updateEditButtonPosition() {
  await nextTick();

  if (!carouselWrapper.value) return;
  const imgs = Array.from(carouselWrapper.value.querySelectorAll('img')) as HTMLElement[];

  if (!imgs || imgs.length === 0) return;
  const wrapRect = carouselWrapper.value.getBoundingClientRect();

  let targetImg: HTMLElement | null = null;
  let maxRight = -Infinity;

  for (const img of imgs) {
    const r = img.getBoundingClientRect();
    const interLeft = Math.max(r.left, wrapRect.left);
    const interRight = Math.min(r.right, wrapRect.right);
    const visibleWidth = interRight - interLeft;
    if (visibleWidth > 0) {
      if (r.right > maxRight) {
        maxRight = r.right;
        targetImg = img;
      }
    }
  }

  const chosen = targetImg || imgs[imgs.length - 1];
  const imgRect = chosen.getBoundingClientRect();
  const top = Math.max(0, imgRect.top - wrapRect.top);
  const right = Math.max(0, wrapRect.right - imgRect.right);
  editButtonStyle.value = { top: `${top}px`, right: `${right}px` };
}

/**
 * Updates the edit button position after a specified delay to avoid excessive calculations.
 *
 * @param delay - The delay in milliseconds before updating the position. Default is 100ms.
 */
function debouncedUpdate(delay = 100) {
  if (updateTimer) clearTimeout(updateTimer);
  updateTimer = setTimeout(() => {
    updateTimer = null;
    void updateEditButtonPosition();
  }, delay);
}

/**
 * Handles window resize events by scheduling an update to the edit button position.
 */
function handleResize() {
  debouncedUpdate();
}

/**
 * Lifecycle hook that runs when the component is mounted.
 * Sets up the initial edit button position and adds a resize event listener.
 */
onMounted(() => {
  updateEditButtonPosition();
  window.addEventListener('resize', handleResize);
});

/**
 * Lifecycle hook that runs when the component is about to be unmounted.
 * Cleans up the resize event listener and any pending timers.
 */
onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize);
  if (updateTimer) {
    clearTimeout(updateTimer);
    updateTimer = null;
  }
});

/**
 * Attempts to close the gallery modal by requesting confirmation from the GalleryEditor component.
 * If the component does not expose a requestClose method, it closes immediately.
 * Errors during the requestClose call are caught and logged.
 */
async function tryCloseGallery() {
  try {
    const ok = await galleryRef.value?.requestClose?.();
    if (ok === undefined || ok) {
      showGalleryModal.value = false;
    }
  } catch (e) {
    console.error('[location/[id].vue] requestClose failed', e);
  }
}

/**
 * Handler for when the gallery has been saved.
 * Closes the gallery modal and refreshes the location data to reflect changes.
 * If refreshing fails, it falls back to a full page reload.
 */
async function onGallerySaved() {
  showGalleryModal.value = false;
  try {
    await refresh();
  } catch {
    window.location.reload();
  }
}
</script>
