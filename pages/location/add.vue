<template>
  <div class="flex items-center justify-center min-h-screen bg-sky-50 dark:bg-slate-800 px-40">
    <UCard class="w-full max-w-4xl shadow-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-center">Přidat novou lokalitu</h2>
      </template>

      <UForm
        ref="formRef"
        :state="formState"
        :schema="schema"
        class="space-y-6 px-12 py-8"
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
            <UInput
              type="file"
              multiple
              accept="image/*"
              class="w-full"
              @change="handleFileUpload"
            />
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

        <div class="pt-4 flex justify-center">
          <UButton
            type="submit"
            color="secondary"
            variant="solid"
            :loading="loading"
            class="w-1/4 max-w-md"
          >
            <span class="w-full text-center">Uložit lokalitu</span>
          </UButton>
        </div>
      </UForm>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { Database } from '~/types/supabase';

definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

/**
 * Reactive reference to the currently selected category.
 * - Type: string | undefined
 * - Initially undefined, indicating no category is selected.
 * Used to track the user's category selection in the add location page.
 */
const selectedCategory = ref<string | undefined>(undefined);

/**
 * Defines the validation schema for the form using Zod.
 * Ensures that the input data conforms to the specified structure and types.
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
 * Reactive state object to hold the form data.
 * This object is used to bind form inputs and manage the form state.
 */
const formState = reactive({
  name: '',
  description: '',
  category: '',
  city: '',
  country: '',
  map_url: '',
  web_url: '',
  youtube_url: '',
  facebook_url: '',
  instagram_url: '',
  visited: false,
  photos: [] as File[],
});

/**
 * Reactive reference to store error messages for the component.
 */
const errorMessage = ref('');

/**
 * Reactive reference to store success messages for the component.
 */
const successMessage = ref('');

/**
 * Reactive reference to indicate if the form is currently loading.
 */
const loading = ref(false);

/**
 * Načítání kategorií pomocí useAsyncData dle Nuxt Supabase dokumentace
 */
const { data: categoriesData } = await useAsyncData('categories', async () => {
  const supabase = useSupabaseClient<Database>();
  const { data, error } = await supabase.from('categories').select('id, name').order('name');

  if (error) {
    console.error('Chyba při načítání kategorií:', error.message);
    return [];
  }

  return data;
});

// Zpracování kategorií do formátu pro USelectMenu
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
 * @param {Event} event - The file input change event containing the uploaded file(s).
 */
function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (input.files) {
    formState.photos = Array.from(input.files);
  }
}

/**
 * Watches for changes in the `selectedCategory` variable.
 * Executes the provided callback function whenever `selectedCategory` changes,
 * passing the new value (`newVal`) as an argument.
 *
 * @param {Ref} selectedCategory - The reactive reference being observed.
 * @param {Function} callback - Function to execute when the value changes.
 */
watch(selectedCategory, (newVal) => {
  formState.category = newVal ?? '';
});

/**
 * Inserts a new location associated with the specified user.
 *
 * @param {string} userId - The unique identifier of the user for whom the location is being added.
 * @returns {Promise<void>} A promise that resolves when the location has been successfully inserted.
 */
async function insertLocation(userId: string) {
  const supabase = useSupabaseClient<Database>();

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
 * Uploads photos for a specific location and user.
 *
 * @param {string} locationId - The unique identifier of the location to which photos will be uploaded.
 * @param {string} userId - The unique identifier of the user uploading the photos.
 * @returns {Promise<void>} A promise that resolves when the upload process is complete.
 */
async function uploadPhotos(locationId: string, userId: string) {
  const supabase = useSupabaseClient<Database>();

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
      is_main: i === 0,
      created_at: new Date().toISOString(),
    });
  }
}

/**
 * Handles the form submission for adding a new location.
 * Performs necessary validation, processes form data, and triggers any required API calls.
 * Should be called when the user submits the add location form.
 *
 * @param {FormSubmitEvent} _event - The form submission event containing the form data.
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
    const location = await insertLocation(user.value!.id);
    await uploadPhotos(location.id, user.value!.id);

    const message = 'Lokalita byla úspěšně uložena';
    await navigateTo(`/?success=${encodeURIComponent(message)}`);
  } catch (err: unknown) {
    errorMessage.value = err instanceof Error ? err.message : 'Došlo k chybě při ukládání.';
  } finally {
    loading.value = false;
  }
}
</script>
