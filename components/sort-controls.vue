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
