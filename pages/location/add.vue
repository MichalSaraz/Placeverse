<template>
  <div class="flex items-center justify-center min-h-screen bg-sky-50 dark:bg-slate-800 px-40">
    <UCard class="w-full max-w-4xl shadow-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-center">Přidat novou lokalitu</h2>
      </template>

      <LocationForm :is-edit="false" @success="handleSuccess" @error="handleError" />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { Tables } from '~/types/supabase';

definePageMeta({
  layout: 'default',
  middleware: 'auth',
});

/**
 * Handles the successful response after adding a location.
 *
 * @param data - An object containing the newly added location and a success message.
 * @property {Tables<'location'>} location - The location data returned from the operation.
 * @property {string} message - A message describing the success of the operation.
 */
async function handleSuccess(data: { location: Tables<'location'>; message: string }) {
  await navigateTo(`/?success=${encodeURIComponent(data.message)}`);
}

/**
 * Handles error messages by processing the provided error string.
 * @param error - The error message to handle.
 */
function handleError(error: string) {
  console.error('Chyba při ukládání lokality:', error);
}
</script>
