<template>
  <UTooltip
    :text="coordinates"
    :ui="{
      content:
        'px-1 py-1 text-xxs bg-gray-200 text-black rounded shadow-sm max-w-none leading-tight',
      wrapper: 'inline-block',
    }"
    :content="{
      side: 'right',
    }"
  >
    <UButton :to="props.url" target="_blank" size="xs" color="secondary" variant="outline">
      <template #leading>
        <UIcon name="i-heroicons-map-pin" class="w-3 h-3 text-red-500" />
      </template>
      Zobrazit na mapě
    </UButton>
  </UTooltip>
</template>

<script setup lang="ts">
import { extractCoordinatesFromUrl } from '~/utils/mapUtils';

interface Props {
  /**
   * URL of the map that contains coordinates.
   */
  url: string;
}

const props = defineProps<Props>();

/**
 * Extracted coordinates from the provided URL.
 */
const coordinates = computed(() => {
  const extractedCoords = extractCoordinatesFromUrl(props.url);

  if (extractedCoords) {
    return `LAT: ${extractedCoords.lat.toFixed(4)}, LNG: ${extractedCoords.lng.toFixed(4)}`;
  }

  return '';
});
</script>
