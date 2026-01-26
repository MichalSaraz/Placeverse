<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div class="flex flex-row items-center gap-x-4">
        <UButton
          v-if="isSearching"
          icon="i-lucide-search-x"
          color="neutral"
          variant="soft"
          class="cursor-pointer"
          size="sm"
          @click="$emit('clear-search')"
        >
          Zrušit
        </UButton>
        <div>
          <h1 class="text-2xl font-bold">
            {{ isSearching ? 'Výsledky vyhledávání' : 'Moje lokality' }}
          </h1>
          <p v-if="isSearching && searchQuery" class="mt-1 text-gray-600 dark:text-gray-400">
            Vyhledaný termín:
            <span class="font-medium">"{{ searchQuery }}"</span>
          </p>
        </div>
      </div>

      <UButton icon="i-heroicons-plus" to="/location/add">Přidat lokalitu</UButton>
    </div>

    <div class="flex items-center justify-between gap-6">
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
