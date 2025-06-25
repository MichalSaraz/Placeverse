<template>
  <div class="flex items-center justify-center min-h-screen bg-sky-50 px-40">
    <UCard class="w-150 shadow-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-center">
          Přihlášení do Placeverse
        </h2>
      </template>

      <form class="space-y-6" @submit.prevent="handleLogin">
        <div class="flex flex-col items-center gap-y-4 max-w-md mx-auto">
          <div class="flex items-center w-full">
            <label for="email" class="w-40 font-medium text-gray-700"
              >Email</label
            >
            <UInput
              id="email"
              v-model="email"
              color="secondary"
              type="email"
              placeholder="např. uzivatel@email.com"
              required
              class="flex-1"
            />
          </div>

          <div class="flex items-center w-full">
            <label for="password" class="w-40 font-medium text-gray-700"
              >Heslo</label
            >
            <UInput
              id="password"
              v-model="password"
              color="secondary"
              type="password"
              placeholder="••••••••"
              required
              class="flex-1"
            />
          </div>
        </div>

        <UAlert
          v-if="errorMessage"
          color="error"
          icon="i-heroicons-exclamation-circle"
          :description="errorMessage"
        />

        <div class="pt-4 flex justify-center">
          <UButton
            type="submit"
            color="secondary"
            variant="solid"
            :loading="loading"
            class="w-1/2 mx-auto items-center justify-center"
          >
            Přihlásit se
          </UButton>
        </div>
      </form>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          Nemáte účet?
          <NuxtLink to="/register" class="text-blue-600 hover:underline"
            >Zaregistrujte se</NuxtLink
          >
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'dialog',
});

/**
 * User's email for login
 */
const email = ref('');

/**
 * User's password for login
 */
const password = ref('');

/**
 * Error message to display on login failure
 */
const errorMessage = ref('');

/**
 * Loading state for the login button
 */
const loading = ref(false);

/**
 * Supabase client instance for authentication
 */
const supabase = useSupabaseClient();

/**
 * Navigation function to redirect after successful login
 *
 * @returns A promise that resolves when navigation is complete
 */
const handleLogin = async (): Promise<void> => {
  errorMessage.value = '';
  loading.value = true;

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  loading.value = false;

  if (error) {
    errorMessage.value = 'Neplatný e-mail nebo heslo.';
    return;
  }

  await navigateTo('/');
};
</script>
