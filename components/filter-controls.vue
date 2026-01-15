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
      icon="i-heroicons-map-pin"
      title="Kategorie"
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
      icon="i-lucide-eye"
      title="Navštíveno"
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
      icon="i-lucide-camera"
      title="Fotografie"
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
      icon="i-lucide-link"
      title="Odkazy"
    />

    <UTooltip v-if="hasActiveFilters" text="Vymazat filtry" :content="{ side: 'top' }">
      <UButton
        icon="i-heroicons-x-mark"
        color="neutral"
        variant="subtle"
        size="sm"
        @click="clearFilters"
      />
    </UTooltip>

    <UTooltip
      v-if="hasActiveFilters"
      text="Zkopírovat odkaz pro sdílení"
      :content="{ side: 'top' }"
    >
      <UButton
        ref="shareButton"
        :icon="shareButtonIcon"
        color="neutral"
        variant="subtle"
        size="sm"
        @click="copyUrlToClipboard"
      />
    </UTooltip>
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
 * Use query filters composable
 */
const { filters, hasActiveFilters, updateFilters, clearFilterOptions } = useQueryFilters();

/**
 * Local UI state for select components
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
 * Sync local UI state with filters from URL
 */
function syncLocalStateFromFilters() {
  // Category
  if (filters.category) {
    selectedCategory.value = {
      label: filters.category,
      value: filters.category,
    };
  } else {
    selectedCategory.value = null;
  }

  // Visited
  if (filters.visited !== null) {
    selectedVisited.value = {
      label: filters.visited ? 'Navštívené' : 'Nenavštívené',
      value: filters.visited,
    };
  } else {
    selectedVisited.value = null;
  }

  // Photos
  if (filters.hasPhotos !== null) {
    selectedHasPhotos.value = {
      label: filters.hasPhotos ? 'S fotkami' : 'Bez fotek',
      value: filters.hasPhotos,
    };
  } else {
    selectedHasPhotos.value = null;
  }

  // Links
  if (filters.hasLinks !== null) {
    selectedHasLinks.value = {
      label: filters.hasLinks ? 'S odkazy' : 'Bez odkazů',
      value: filters.hasLinks,
    };
  } else {
    selectedHasLinks.value = null;
  }
}

/**
 * Watch filters from URL and sync local state
 */
watch(
  filters,
  () => {
    syncLocalStateFromFilters();

    // Emit to parent
    emit('update:filters', {
      category: filters.category,
      visited: filters.visited,
      hasPhotos: filters.hasPhotos,
      hasLinks: filters.hasLinks,
    });
  },
  { immediate: true }
);

/**
 * Watch local UI state changes and update URL filters
 */
watch(
  [selectedCategory, selectedVisited, selectedHasPhotos, selectedHasLinks],
  () => {
    const newFilters = {
      category:
        selectedCategory.value?.value === 'all' ? null : selectedCategory.value?.value ?? null,
      visited: selectedVisited.value?.value === 'all' ? null : selectedVisited.value?.value ?? null,
      hasPhotos:
        selectedHasPhotos.value?.value === 'all' ? null : selectedHasPhotos.value?.value ?? null,
      hasLinks:
        selectedHasLinks.value?.value === 'all' ? null : selectedHasLinks.value?.value ?? null,
    };

    updateFilters(newFilters);
  },
  { deep: true }
);

/**
 * Clear all filters
 */
function clearFilters() {
  clearFilterOptions();
}

const shareButtonIcon = ref('i-lucide-copy');
async function copyUrlToClipboard() {
  const url = window.location.href;
  await navigator.clipboard.writeText(url);
  shareButtonIcon.value = 'i-lucide-check';
  setTimeout(() => {
    shareButtonIcon.value = 'i-lucide-copy';
  }, 2000);
}
</script>
