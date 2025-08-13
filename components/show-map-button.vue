<template>
  <UTooltip :text="coordinates">
    <UButton :to="props.url" target="_blank" icon="i-heroicons-map-pin" size="xs" variant="subtle">
      Zobrazit na mapě
    </UButton>
  </UTooltip>
</template>

<script setup lang="ts">
import { extractCoordinatesFromUrl } from '~/utils/mapUtils';

interface Props {
  url: string;
}

const props = defineProps<Props>();

const coordinates = computed(() => {
  const extractedCoords = extractCoordinatesFromUrl(props.url);

  if (extractedCoords) {
    return `LAT: ${extractedCoords.lat.toFixed(4)}, LNG: ${extractedCoords.lng.toFixed(4)}`;
  }

  return '';
})
</script>
