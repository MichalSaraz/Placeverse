<template>
  <div class="flex items-center gap-3">
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
</template>

<script setup lang="ts">
interface Emit {
  'update:sort-by': [value: string];
  'update:sort-direction': [value: 'asc' | 'desc'];
}

const emit = defineEmits<Emit>();

/**
 * Use query filters composable for sort management
 */
const { filters, updateSort } = useQueryFilters();

/**
 * Local UI state for select components
 */
const selectedSortBy = ref({ label: 'Vytvořeno', value: 'created_at' });
const sortDirection = ref<'asc' | 'desc'>('desc');

const sortOptions = [
  { label: 'Vytvořeno', value: 'created_at' },
  { label: 'Název místa', value: 'name' },
  { label: 'Lokalita', value: 'location' },
];

/**
 * Sync local UI state with filters from URL
 */
function syncLocalStateFromFilters() {
  const foundOption = sortOptions.find((option) => option.value === filters.sortBy);
  if (foundOption) {
    selectedSortBy.value = foundOption;
  }

  sortDirection.value = filters.sortDirection;
}

/**
 * Watch filters from URL and sync local state
 */
watch(
  filters,
  () => {
    syncLocalStateFromFilters();

    emit('update:sort-by', filters.sortBy);
    emit('update:sort-direction', filters.sortDirection);
  },
  { immediate: true }
);

/**
 * Watch local UI state changes and update URL sort
 */
watch([selectedSortBy, sortDirection], ([newSortBy, newSortDirection]) => {
  updateSort({
    sortBy: newSortBy.value,
    sortDirection: newSortDirection,
  });
});

/**
 * Toggle sort direction between ascending and descending
 */
function toggleSortDirection() {
  sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc';
}
</script>
