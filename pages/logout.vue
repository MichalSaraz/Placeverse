<template>
  <h1>Uživatel bude odhlášen.</h1>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
});

/**
 * Supabase client instance for interacting with the database.
 */
const supabase = useSupabaseClient();

/**
 * Redirects the user to the login page after logging out.
 *
 * @returns A promise that resolves when navigation is complete
 */
const logout = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Během odhlašování došlo k chybě.',
      fatal: true,
    });
  }
  await navigateTo('/login', { replace: true });
};

/**
 * Lifecycle hook that runs when the component is mounted.
 */
onMounted(() => logout());
</script>
