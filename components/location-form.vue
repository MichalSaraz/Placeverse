<template>
  <UForm
    ref="formRef"
    :state="formState"
    :schema="schema"
    class="px-12 py-8 space-y-6"
    @submit="handleSubmit"
  >
    <UFormField name="name" label="Název místa" required>
      <UInput v-model="formState.name" placeholder="Název místa" class="w-full" />
    </UFormField>

    <UFormField name="description" label="Popis místa">
      <UTextarea v-model="formState.description" placeholder="Popis místa..." class="w-full" />
    </UFormField>

    <UFormField name="category" label="Kategorie" required>
      <USelectMenu
        v-model="selectedCategory"
        :items="categories"
        value-key="value"
        placeholder="Vyberte kategorii"
        class="w-full"
      />
    </UFormField>

    <div class="grid grid-cols-2 gap-x-6">
      <UFormField name="city" label="Město" required>
        <UInput v-model="formState.city" placeholder="Praha" class="w-full" />
      </UFormField>
      <UFormField name="country" label="Země" required>
        <UInput v-model="formState.country" placeholder="Česká republika" class="w-full" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-x-6">
      <UFormField name="photos" label="Fotky místa" class="col-span-1">
        <template v-if="props.isEdit && props.initialData?.id">
          <div class="flex items-center gap-4">
            <UButton type="button" color="secondary" class="cursor-pointer" @click="openGallery">
              Upravit galerii
            </UButton>
          </div>
        </template>

        <template v-else>
          <UInput type="file" multiple accept="image/*" class="w-full" @change="handleFileUpload" />
        </template>
      </UFormField>
      <UFormField name="map_url" label="Odkaz na mapu" required>
        <UInput v-model="formState.map_url" placeholder="https://..." class="w-full" />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-x-6">
      <UFormField name="web_url" label="Webová stránka">
        <UInput v-model="formState.web_url" placeholder="https://..." class="w-full" />
      </UFormField>
      <UFormField name="youtube_url" label="YouTube URL">
        <UInput
          v-model="formState.youtube_url"
          placeholder="https://youtube.com/..."
          class="w-full"
        />
      </UFormField>
    </div>

    <div class="grid grid-cols-2 gap-x-6">
      <UFormField name="facebook_url" label="Facebook URL">
        <UInput
          v-model="formState.facebook_url"
          placeholder="https://facebook.com/..."
          class="w-full"
        />
      </UFormField>
      <UFormField name="instagram_url" label="Instagram URL">
        <UInput
          v-model="formState.instagram_url"
          placeholder="https://instagram.com/..."
          class="w-full"
        />
      </UFormField>
    </div>

    <UCheckbox v-model="formState.visited" label="Označit jako navštíveno" />

    <UAlert
      v-if="errorMessage"
      color="error"
      icon="i-heroicons-exclamation-circle"
      :description="errorMessage"
    />

    <UAlert
      v-if="successMessage"
      color="success"
      icon="i-heroicons-check-circle"
      :description="successMessage"
    />

    <div class="flex justify-center pt-4">
      <UButton
        type="submit"
        color="primary"
        variant="solid"
        :loading="loading"
        class="w-1/4 max-w-md cursor-pointer"
      >
        <span class="w-full text-center">
          {{ isEdit ? 'Aktualizovat lokalitu' : 'Uložit lokalitu' }}
        </span>
      </UButton>
    </div>
  </UForm>

  <MountedTeleport v-if="isGalleryOpen">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <div class="absolute inset-0 bg-black/50" @click="tryCloseGallery"></div>

      <div
        class="relative z-10 w-full max-w-4xl p-4 mx-4 bg-white rounded-lg shadow-lg dark:bg-slate-900"
      >
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold">Upravit galerii</h3>
          <UButton size="sm" variant="ghost" class="cursor-pointer" @click="tryCloseGallery">
            Zavřít
          </UButton>
        </div>

        <div class="max-h-[70vh] overflow-auto">
          <GalleryEditor
            ref="galleryRef"
            :location-id="props.initialData?.id"
            @saved="onGallerySaved"
            @cancel="isGalleryOpen = false"
          />
        </div>
      </div>
    </div>
  </MountedTeleport>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Database, Tables } from '~/types/supabase';
import GalleryEditor from '~/components/gallery-editor.vue';

/**
 * Props interface for the LocationForm component.
 * Defines the expected properties to be passed to the component.
 */
interface Props {
  isEdit?: boolean;
  initialData?: {
    id?: string;
    name?: string;
    description?: string;
    category_id?: string;
    city?: string;
    country?: string;
    map_url?: string;
    web_url?: string;
    youtube_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    visited?: boolean;
  };
}

/**
 * Defines the types of events emitted by the component.
 */
interface Emits {
  (e: 'success', data: { location: Tables<'location'>; message: string }): void;
  (e: 'error', error: string): void;
}

/**
 * Defines the component's props with default values using `withDefaults` and `defineProps`.
 */
const props = withDefaults(defineProps<Props>(), {
  isEdit: false,
  initialData: () => ({}),
});

/**
 * Initializes the emit function for emitting custom events defined in the Emits type.
 */
const emit = defineEmits<Emits>();

/**
 * Supabase client instance for database operations.
 */
const supabase = useSupabaseClient<Database>();

/**
 * Defines the validation schema for the form using Zod.
 */
const schema = z.object({
  name: z.string().min(1, 'Název je povinný.'),
  description: z.string().optional(),
  category: z.string().min(1, 'Kategorie je povinná.'),
  city: z.string().min(1, 'Město je povinné.'),
  country: z.string().min(1, 'Země je povinná.'),
  map_url: z.string().url('Neplatný formát URL (Mapy).'),
  web_url: z.string().url('Neplatný formát URL.').optional().or(z.literal('')),
  youtube_url: z.string().url('Neplatný YouTube URL.').optional().or(z.literal('')),
  facebook_url: z.string().url('Neplatný Facebook URL.').optional().or(z.literal('')),
  instagram_url: z.string().url('Neplatný Instagram URL.').optional().or(z.literal('')),
  visited: z.boolean().optional(),
  photos: z.any().optional(),
});

/**
 * Reference to the form component instance.
 *
 * @param {string} location - The location string to parse.
 * @returns {Object} An object containing the city and country.
 */
function parseLocation(location: string) {
  const parts = location.split(', ');
  return {
    city: parts[0] || '',
    country: parts[1] || '',
  };
}

/**
 * Initializes and returns the default state object for the location form.
 * This function sets up all necessary fields and their initial values,
 * ensuring the form is ready for user interaction.
 *
 * @returns {Object} The initial state of the location form.
 */
const initializeFormState = () => {
  const locationParts =
    props.initialData?.city && props.initialData?.country
      ? { city: props.initialData.city, country: props.initialData.country }
      : parseLocation('');

  return {
    name: props.initialData?.name || '',
    description: props.initialData?.description || '',
    category: props.initialData?.category_id || '',
    city: locationParts.city,
    country: locationParts.country,
    map_url: props.initialData?.map_url || '',
    web_url: props.initialData?.web_url || '',
    youtube_url: props.initialData?.youtube_url || '',
    facebook_url: props.initialData?.facebook_url || '',
    instagram_url: props.initialData?.instagram_url || '',
    visited: props.initialData?.visited || false,
    photos: [] as File[],
  };
};

/**
 * Reactive state object to hold the form data.
 */
const formState = reactive(initializeFormState());

/**
 * Reactive reference to the currently selected category.
 */
const selectedCategory = ref<string | undefined>(props.initialData?.category_id);

/**
 * Reactive messages for the component.
 * - errorMessage: stores an error message to display to the user.
 * - successMessage: stores a success message to display after successful operations.
 */
const errorMessage = ref('');
const successMessage = ref('');

/**
 * Reactive reference to indicate if the form is currently loading.
 */
const loading = ref(false);

/**
 * Fetches category data asynchronously using useAsyncData.
 * The data is assigned to categoriesData.
 *
 * @returns {Promise<Object>} categoriesData - The fetched category data.
 */
const { data: categoriesData } = await useAsyncData('categories', async () => {
  const { data, error } = await supabase.from('categories').select('id, name').order('name');

  if (error) {
    console.error('Chyba při načítání kategorií:', error.message);
    return [];
  }

  return data;
});

/**
 * Computed property that returns the list of categories.
 * The value is dynamically calculated based on reactive dependencies.
 */
const categories = computed(() => {
  if (!categoriesData.value) return [];

  return categoriesData.value.map((cat) => ({
    label: cat.name,
    value: cat.id,
  }));
});

/**
 * Handles the file upload event triggered by the user.
 * Processes the selected file(s) from the input element.
 *
 * @param {Event} event - The file input change event containing uploaded files.
 */
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    formState.photos = Array.from(input.files);
  }
}

/**
 * Watches for changes in the `selectedCategory` variable.
 */
watch(selectedCategory, (newVal) => {
  formState.category = newVal ?? '';
});

/**
 * Inserts a new location for the specified user.
 *
 * @param {string} userId - The unique identifier of the user for whom the location is being inserted.
 * @returns {Promise<void>} A promise that resolves when the location has been successfully inserted.
 */
async function insertLocation(userId: string) {
  const { data, error } = await supabase
    .from('location')
    .insert([
      {
        name: formState.name,
        description: formState.description || null,
        category_id: selectedCategory.value ?? '',
        location: `${formState.city}, ${formState.country}`,
        map_url: formState.map_url,
        web_url: formState.web_url || null,
        youtube_url: formState.youtube_url || null,
        facebook_url: formState.facebook_url || null,
        instagram_url: formState.instagram_url || null,
        visited: formState.visited || false,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error || !data) throw error;

  return data;
}

/**
 * Updates the location information for a given location and user.
 *
 * @param {string} locationId - The unique identifier of the location to update.
 * @param {string} userId - The unique identifier of the user performing the update.
 * @returns {Promise<void>} A promise that resolves when the location has been updated.
 */
async function updateLocation(locationId: string, userId: string) {
  const { data, error } = await supabase
    .from('location')
    .update({
      name: formState.name,
      description: formState.description || null,
      category_id: selectedCategory.value ?? '',
      location: `${formState.city}, ${formState.country}`,
      map_url: formState.map_url,
      web_url: formState.web_url || null,
      youtube_url: formState.youtube_url || null,
      facebook_url: formState.facebook_url || null,
      instagram_url: formState.instagram_url || null,
      visited: formState.visited || false,
    })
    .eq('id', locationId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('❌ Update failed:', error);
    throw error;
  }

  return data;
}

/**
 * Uploads photos for a specific location and user.
 *
 * @param {string} locationId - The unique identifier of the location.
 * @param {string} userId - The unique identifier of the user uploading the photos.
 * @returns {Promise<void>} A promise that resolves when the upload is complete.
 */
async function uploadPhotos(locationId: string, userId: string) {
  let existingCount = 0;

  try {
    const { data: existing, error: selectError } = await supabase
      .from('photos')
      .select('id')
      .eq('location_id', locationId);

    if (selectError) {
      console.warn('Could not load existing photos for location', locationId, selectError);
    } else if (Array.isArray(existing)) {
      existingCount = existing.length;
    }
  } catch (e) {
    console.warn('Could not determine existing photos count', e);
  }

  for (let i = 0; i < formState.photos.length; i++) {
    const photo = formState.photos[i];
    if (!photo) {
      console.warn(`Photo at index ${i} is undefined, skipping...`);
      continue;
    }

    const filePath = `user-${userId}/${Date.now()}-${photo.name}`;

    const { error: uploadError } = await supabase.storage
      .from('location-photos')
      .upload(filePath, photo);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from('location-photos').getPublicUrl(filePath);

    await supabase.from('photos').insert({
      location_id: locationId,
      photo_url: publicUrl,
      is_main: existingCount === 0 && i === 0,
      created_at: new Date().toISOString(),
    });

    existingCount++;
  }
}

/**
 * Reactive reference to indicate if the gallery editor is open.
 */
const isGalleryOpen = ref(false);

/**
 * Reference to the GalleryEditor component instance.
 */
const galleryRef = ref<{ requestClose?: () => Promise<boolean> } | null>(null);

/**
 * Handles the event when the gallery has been saved.
 * Closes the gallery and displays a success message.
 */
function onGallerySaved() {
  isGalleryOpen.value = false;
  successMessage.value = 'Galerie byla upravena';
}

/**
 * Opens the gallery editor by setting the isGalleryOpen flag to true.
 */
function openGallery() {
  isGalleryOpen.value = true;
}

/**
 * Attempts to close the gallery editor.
 * If the gallery component has a requestClose method, it calls it and waits for confirmation.
 * If confirmed, or if no requestClose method exists, it sets isGalleryOpen to false.
 *
 * @returns {Promise<void>} Resolves when the gallery has been closed or the request has been handled.
 */
async function tryCloseGallery() {
  if (galleryRef.value?.requestClose) {
    try {
      const ok = await galleryRef.value.requestClose();
      if (ok) isGalleryOpen.value = false;
    } catch (e) {
      console.error('[LocationForm] requestClose failed', e);
    }
  } else {
    isGalleryOpen.value = false;
  }
}

/**
 * Handles the submission of the location form.
 * Performs asynchronous operations such as validation and data processing.
 * Should be called when the user submits the form.
 *
 * @returns {Promise<void>} Resolves when the submission process is complete.
 */
async function handleSubmit(
  _event: FormSubmitEvent<{
    name: string;
    description?: string;
    category: string;
    city: string;
    country: string;
    map_url: string;
    web_url?: string;
    youtube_url?: string;
    facebook_url?: string;
    instagram_url?: string;
    visited?: boolean;
    photos?: File[];
  }>
) {
  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const user = useSupabaseUser();

    if (!user.value) {
      throw new Error('Uživatel není přihlášen');
    }

    let location;

    if (props.isEdit && props.initialData?.id) {
      location = await updateLocation(props.initialData.id, user.value.id);
    } else {
      location = await insertLocation(user.value.id);
    }

    if (formState.photos.length > 0) {
      await uploadPhotos(location.id, user.value.id);
    }

    const message = props.isEdit
      ? 'Lokalita byla úspěšně aktualizována'
      : 'Lokalita byla úspěšně uložena';

    emit('success', { location, message });
  } catch (err: unknown) {
    const error = err instanceof Error ? err.message : 'Došlo k chybě při ukládání.';
    errorMessage.value = error;
    emit('error', error);
  } finally {
    loading.value = false;
  }
}

/**
 * Watch props.initialData and reinitialize form state when incoming initial data changes.
 */
watch(
  () => props.initialData,
  (newData) => {
    if (newData && Object.keys(newData).length > 0) {
      const newFormState = initializeFormState();
      Object.assign(formState, newFormState);
      selectedCategory.value = newData.category_id;
    }
  },
  { deep: true, immediate: true }
);
</script>
