<template>
  <div class="flex items-center gap-3">
    <span class="text-sm text-gray-600 dark:text-gray-400 font-medium">Filtrovat:</span>

    <USelectMenu
      v-model="selectedCategory"
      :items="categoryOptions"
      :search-input="false"
      color="neutral"
      variant="soft"
      class="w-36"
      size="sm"
      placeholder="Kategorie"
    />

    <USelectMenu
      v-model="selectedVisited"
      :items="visitedOptions"
      :search-input="false"
      color="neutral"
      variant="soft"
      class="w-32"
      size="sm"
      placeholder="Navštíveno"
    />

    <USelectMenu
      v-model="selectedHasPhotos"
      :items="photosOptions"
      :search-input="false"
      color="neutral"
      variant="soft"
      class="w-32"
      size="sm"
      placeholder="Fotky"
    />

    <USelectMenu
      v-model="selectedHasLinks"
      :items="linksOptions"
      :search-input="false"
      color="neutral"
      variant="soft"
      class="w-32"
      size="sm"
      placeholder="Odkazy"
    />

    <UButton
      v-if="hasActiveFilters"
      icon="i-heroicons-x-mark"
      color="neutral"
      variant="outline"
      size="sm"
      @click="clearFilters"
    >
      Vymazat filtry
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  availableCategories?: string[];
}

interface Emit {
  'update:filters': [
    filters: {
      category: string | null;
      visited: boolean | null;
      hasPhotos: boolean | null;
      hasLinks: boolean | null;
    }
  ];
}

const props = defineProps<Props>();
const emit = defineEmits<Emit>();

/**
 * Filtering state
 */
const selectedCategory = ref<{ label: string; value: string } | null>(null);
const selectedVisited = ref<{ label: string; value: boolean | string } | null>(null);
const selectedHasPhotos = ref<{ label: string; value: boolean | string } | null>(null);
const selectedHasLinks = ref<{ label: string; value: boolean | string } | null>(null);

/**
 * Filter options
 */
const categoryOptions = computed(() => {
  const baseOptions = [{ label: 'Všechny kategorie', value: 'all' }];
  const categories =
    props.availableCategories?.map((cat) => ({
      label: cat,
      value: cat,
    })) || [];
  return [...baseOptions, ...categories];
});

const visitedOptions = [
  { label: 'Vše', value: 'all' },
  { label: 'Navštívené', value: true },
  { label: 'Nenavštívené', value: false },
];

const photosOptions = [
  { label: 'Vše', value: 'all' },
  { label: 'S fotkami', value: true },
  { label: 'Bez fotek', value: false },
];

const linksOptions = [
  { label: 'Vše', value: 'all' },
  { label: 'S odkazy', value: true },
  { label: 'Bez odkazů', value: false },
];

/**
 * Check if any filters are active
 */
const hasActiveFilters = computed(() => {
  return (
    (selectedCategory.value?.value !== 'all' && selectedCategory.value !== null) ||
    (selectedVisited.value?.value !== 'all' && selectedVisited.value !== null) ||
    (selectedHasPhotos.value?.value !== 'all' && selectedHasPhotos.value !== null) ||
    (selectedHasLinks.value?.value !== 'all' && selectedHasLinks.value !== null)
  );
});

/**
 * Watch for filter changes and emit to parent
 */
watch(
  [selectedCategory, selectedVisited, selectedHasPhotos, selectedHasLinks],
  () => {
    emit('update:filters', {
      category:
        selectedCategory.value?.value === 'all' ? null : selectedCategory.value?.value ?? null,
      visited: selectedVisited.value?.value === 'all' ? null : selectedVisited.value?.value ?? null,
      hasPhotos:
        selectedHasPhotos.value?.value === 'all' ? null : selectedHasPhotos.value?.value ?? null,
      hasLinks:
        selectedHasLinks.value?.value === 'all' ? null : selectedHasLinks.value?.value ?? null,
    });
  },
  { immediate: true }
);

/**
 * Clear all filters
 */
function clearFilters() {
  selectedCategory.value = null;
  selectedVisited.value = null;
  selectedHasPhotos.value = null;
  selectedHasLinks.value = null;
}
</script>
