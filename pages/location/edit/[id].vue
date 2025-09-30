<template>
  <div class="flex items-center justify-center min-h-screen bg-sky-50 dark:bg-slate-800 px-40">
    <UCard class="w-full max-w-4xl shadow-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-center">Upravit lokalitu</h2>
      </template>

      <LocationForm
        v-if="location"
        :is-edit="true"
        :initial-data="locationFormData"
        @success="handleSuccess"
        @error="handleError"
      />

      <div v-else-if="pending" class="flex justify-center items-center py-12">
        <div class="text-center">
          <div class="text-lg">Načítání lokality...</div>
        </div>
      </div>

      <div v-else class="px-12 py-8 text-center">
        <UAlert
          color="error"
          icon="i-heroicons-exclamation-triangle"
          title="Chyba"
          description="Lokalita nebyla nalezena nebo nemáte oprávnění k její úpravě."
        />
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Tables, Database } from '~/types/supabase';

definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

/**
 * Retrieves the current route object using Vue Router's `useRoute` composable.
 * This provides access to route parameters, query, and other route-related information.
 */
const route = useRoute();
const id = route.params.id as string;

/**
 * Supabase client instance for interacting with the database.
 */
const supabase = useSupabaseClient<Database>();

/**
 * Destructures properties or methods from an object, typically used to extract reactive state or functions
 * from a composable or store in a Vue component.
 */
const {
  data: location,
  error,
  pending,
  refresh,
} = await useAsyncData(`location:${id}`, async () => {
  const { data, error } = await supabase
    .from('location')
    .select(
      `
        *,
        categories (
          name
        )
      `
    )
    .eq('id', id)
    .single();

  if (error) {
    throw error;
  }

  return data;
});

if (error.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Location not found',
  });
}

/**
 * Parses a location string and returns a structured representation.
 *
 * @param location - The location string to parse.
 * @returns The parsed location data.
 */
function parseLocation(location: string) {
  const parts = location.split(', ');
  return {
    city: parts[0] || '',
    country: parts[1] || '',
  };
}

/**
 * Computed property that returns the form data for the location being edited.
 * Typically used to bind reactive data to the location edit form.
 */
const locationFormData = computed(() => {
  if (!location.value) return {};

  const locationParts = parseLocation(location.value.location || '');

  return {
    id: location.value.id,
    name: location.value.name,
    description: location.value.description,
    category_id: location.value.category_id,
    city: locationParts.city,
    country: locationParts.country,
    map_url: location.value.map_url,
    web_url: location.value.web_url,
    youtube_url: location.value.youtube_url,
    facebook_url: location.value.facebook_url,
    instagram_url: location.value.instagram_url,
    visited: location.value.visited,
  };
});

/**
 * Handles the successful response after editing a location.
 *
 * @param data - An object containing the updated location and a success message.
 * @param data.location - The updated location object from the database.
 * @param data.message - A message describing the success of the operation.
 */
async function handleSuccess(data: { location: Tables<'location'>; message: string }) {
  await refresh();
  await navigateTo(`/?success=${encodeURIComponent(data.message)}`);
}

/**
 * Handles errors by processing the provided error message.
 * @param error - The error message to handle.
 */
function handleError(error: string) {
  console.error('Chyba při aktualizaci lokality:', error);
}
</script>
