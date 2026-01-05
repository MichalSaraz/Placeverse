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

    <div class="flex justify-between items-center gap-6">
      <FilterControls
        :available-categories="availableCategories"
        @update:filters="$emit('update:filters', $event)"
      />

      <SortControls
        @update:sort-by="$emit('update:sort-by', $event)"
        @update:sort-direction="$emit('update:sort-direction', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isSearching: boolean;
  searchQuery: string;
  availableCategories?: string[];
}

interface Emit {
  'clear-search': [];
  'update:sort-by': [value: string];
  'update:sort-direction': [value: 'asc' | 'desc'];
  'update:filters': [
    filters: {
      category: string | null;
      visited: boolean | null;
      hasPhotos: boolean | null;
      hasLinks: boolean | null;
    }
  ];
}

defineProps<Props>();
defineEmits<Emit>();
</script>
