<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50"
    @click="isOpen = false"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-lg mx-4"
      @click.stop
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold">Vyhledat lokality</h3>
        <UButton
          color="gray"
          variant="ghost"
          icon="i-heroicons-x-mark-20-solid"
          class="-my-1"
          @click="isOpen = false"
        />
      </div>

      <UInputMenu
        ref="searchInput"
        v-model="selectedSuggestion"
        v-model:search-term="searchQuery"
        :items="suggestionData"
        :loading="isLoading"
        :ignore-filter="true"
        placeholder="Zadejte název lokality nebo místo..."
        icon="i-heroicons-magnifying-glass-20-solid"
        trailing-icon=""
        size="lg"
        class="w-full"
        autofocus
        @update:search-term="onSearchInput"
        @update:model-value="onSuggestionSelect"
        @keydown.enter="handleEnter"
        @keydown.escape="isOpen = false"
        @highlight="onHighlight"
      >
        <template #item="{ item }">
          <div
            class="flex items-center space-x-3 p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors w-full"
          >
            <UAvatar
              :src="item.informationType === 'name' ? item.main_photo_url : null"
              icon="i-lucide-map-pin"
            />
            <div class="flex-1">
              <p class="font-medium">{{ item.displayText }}</p>
              <p v-if="item.informationType === 'name'" class="text-sm text-gray-500">
                {{ item.location }}
              </p>
            </div>
          </div>
        </template>
        <template #content-bottom>
          <div
            v-if="toBeSearchedText"
            class="w-full p-2 text-center text-sm text-gray-500 border-t mt-2 border-gray-200 dark:border-gray-800"
          >
            Stiskněte Enter pro vyhledání:
            <strong>{{ toBeSearchedText }}</strong>
          </div>
        </template>
      </UInputMenu>
    </div>
  </div>
</template>

<script setup lang="ts">
interface SearchSuggestion {
  id: string;
  name: string;
  location: string;
  displayText: string;
  main_photo_url: string | null;
  informationType: 'name' | 'location';
}

interface Props {
  modelValue: boolean;
}

interface Emit {
  'update:modelValue': [value: boolean];
}

const props = defineProps<Props>();
const emit = defineEmits<Emit>();

/**
 * Modal open state computed from v-model
 */
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const searchQuery = ref('');
const suggestionData = ref<SearchSuggestion[]>([]);
const selectedSuggestion = ref<string>('');
const isLoading = ref(false);
const searchInput = ref();

/**
 * Use composable for search functionality
 */
const { searchSuggestions } = useLocationSearch();

let searchTimeout: NodeJS.Timeout;

const toBeSearchedText = ref<string | null>(null);
function onHighlight(
  payload: { ref: HTMLElement; value: { displayText: string } } | undefined
): void {
  if (payload && payload.value) {
    toBeSearchedText.value = payload.value.displayText;
  }
}

/**
 * Watches for modal open state to reset and focus input
 */
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      searchInput.value?.$el?.querySelector('input')?.focus();
    });
    resetState();
  }
});

/**
 * Handles selection of a suggestion from the dropdown
 *
 * @param selectedValue - The selected suggestion value (can be string or object)
 */
function onSuggestionSelect(selectedValue: string | SearchSuggestion) {
  let searchText: string;

  if (typeof selectedValue === 'object' && selectedValue !== null) {
    searchText = selectedValue.displayText || selectedValue.name || '';
  } else {
    searchText = selectedValue || '';
  }

  if (searchText && searchText.trim()) {
    searchAndRedirect(searchText.trim());
  }
}

/**
 * Resets the search modal state
 */
function resetState() {
  searchQuery.value = '';
  suggestionData.value = [];
  selectedSuggestion.value = '';
  isLoading.value = false;
  toBeSearchedText.value = null;

  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
}

/**
 * Handles input in the search field
 */
async function onSearchInput() {
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }

  if (searchQuery.value.trim().length < 2) {
    suggestionData.value = [];
    isLoading.value = false;
    return;
  }

  isLoading.value = true;

  searchTimeout = setTimeout(async () => {
    try {
      suggestionData.value = await searchSuggestions(searchQuery.value.trim(), 5);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      suggestionData.value = [];
    } finally {
      toBeSearchedText.value = searchQuery.value.trim();
      isLoading.value = false;
    }
  }, 300);
}

/**
 * Handles Enter key press in the search field
 */
function handleEnter() {
  if (searchQuery.value.trim()) {
    searchAndRedirect(searchQuery.value.trim());
  }
}

/**
 * Performs search and redirects to the main page with query
 *
 * @param query - The search query
 */
function searchAndRedirect(query: string) {
  isOpen.value = false;

  const { updateSearch } = useQueryFilters();
  updateSearch({ search: query });

  if (useRoute().path !== '/') {
    navigateTo('/');
  }
}
</script>
