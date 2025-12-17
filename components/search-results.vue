<template>
  <div>
    <div
      v-if="isSearching && filteredLocations.length === 0 && searchQuery"
      class="text-center py-12"
    >
      <UIcon name="i-heroicons-magnifying-glass-20-solid" class="text-4xl text-gray-400 mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Žádné výsledky nenalezeny
      </h3>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Pro hledaný výraz "{{ searchQuery }}" nebyly nalezeny žádné lokality.
      </p>
      <UButton variant="outline" @click="$emit('clear-search')">Zobrazit všechny lokality</UButton>
    </div>

    <div
      v-else-if="isSearching && filteredLocations.length > 0"
      class="mb-4 text-sm text-gray-600 dark:text-gray-400"
    >
      {{ getFoundText(filteredLocations.length) }} {{ filteredLocations.length }}
      {{ getLocationCountText(filteredLocations.length) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ProcessedLocation } from '~/types/location';

interface Props {
  isSearching: boolean;
  searchQuery: string;
  filteredLocations: ProcessedLocation[];
}

defineProps<Props>();

defineEmits<{
  'clear-search': [];
}>();

/**
 * Returns the correct form of "found" based on count
 */
function getFoundText(count: number) {
  return count === 1 ? 'Nalezena' : count < 5 ? 'Nalezeny' : 'Nalezeno';
}

/**
 * Returns the correct form of "location" based on count
 */
function getLocationCountText(count: number) {
  return count === 1 ? 'lokalita' : count < 5 ? 'lokality' : 'lokalit';
}
</script>
