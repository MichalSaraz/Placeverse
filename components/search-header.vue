<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold">
          {{ isSearching ? 'Výsledky vyhledávání' : 'Moje lokality' }}
        </h1>
        <p v-if="isSearching && searchQuery" class="text-gray-600 dark:text-gray-400 mt-1">
          Výsledky pro:
          <span class="font-medium">"{{ searchQuery }}"</span>
        </p>
      </div>

      <div class="flex gap-2">
        <UButton
          v-if="isSearching"
          icon="i-heroicons-x-mark"
          color="error"
          variant="outline"
          class="cursor-pointer"
          @click="$emit('clear-search')"
        >
          Zrušit vyhledávání
        </UButton>
        <UButton icon="i-heroicons-plus" to="/location/add">Přidat lokalitu</UButton>
      </div>
    </div>

    <div class="flex justify-end items-center gap-3">
      <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">Řadit podle:</span>

      <USelectMenu
        v-model="selectedSortBy"
        :items="sortOptions"
        :search-input="false"
        color="neutral"
        variant="soft"
        class="w-40"
        size="sm"
      />

      <UButton
        :icon="sortDirection === 'asc' ? 'i-heroicons-arrow-up' : 'i-heroicons-arrow-down'"
        color="neutral"
        variant="soft"
        size="sm"
        class="cursor-pointer"
        @click="toggleSortDirection"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isSearching: boolean;
  searchQuery: string;
}

interface Emit {
  'clear-search': [];
  'update:sort-by': [value: string];
  'update:sort-direction': [value: 'asc' | 'desc'];
}

defineProps<Props>();
const emit = defineEmits<Emit>();

/**
 * Sorting state
 */
const selectedSortBy = ref({ label: 'Vytvořeno', value: 'created_at' });
const sortDirection = ref<'asc' | 'desc'>('desc');

const sortOptions = [
  { label: 'Vytvořeno', value: 'created_at' },
  { label: 'Název místa', value: 'name' },
  { label: 'Lokalita', value: 'location' },
];

watch(
  selectedSortBy,
  (newValue) => {
    emit('update:sort-by', newValue.value);
  },
  { immediate: true }
);

watch(
  sortDirection,
  (newValue) => {
    emit('update:sort-direction', newValue);
  },
  { immediate: true }
);

/**
 * Toggle sort direction between ascending and descending
 */
function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
}
</script>
