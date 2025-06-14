<template>
  <div class="flex items-center justify-center min-h-screen bg-sky-50 px-40">
    <UCard class="w-150 shadow-xl">
      <template #header>
        <h2 class="text-xl font-semibold text-center">Registrace uživatele</h2>
      </template>

      <template #default>
        <div v-if="registrationSuccess">
          <UAlert
            title="Registrace dokončena"
            icon="i-heroicons-exclamation-circle"
            description="Na váš e-mail jsme odeslali potvrzovací odkaz. Prosím potvrďte registraci kliknutím na odkaz v e-mailu."
            color="info"
            class="space-y-5 max-w-md mx-auto"
            variant="solid"
          />
        </div>
        <div v-else>
          <UForm
            ref="form"
            :state="state"
            :schema="schema"
            class="space-y-5 max-w-md mx-auto"
            @submit="handleRegister"
          >
            <UFormField
              name="email"
              label="E-mail"
              class="font-medium"
              required
            >
              <UInput
                id="email"
                v-model="state.email"
                type="email"
                placeholder="john.doe@email.com"
                required
                color="secondary"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="username"
              label="Uživatelské jméno"
              class="font-medium"
              required
            >
              <UInput
                id="username"
                v-model="state.username"
                type="text"
                placeholder="JohnDoe"
                required
                color="secondary"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="password"
              label="Heslo"
              class="font-medium"
              required
            >
              <UInput
                id="password"
                v-model="state.password"
                type="password"
                placeholder="••••••••"
                required
                color="secondary"
                class="w-full"
              />
            </UFormField>

            <UFormField
              name="confirmPassword"
              label="Potvrzení hesla"
              class="font-medium"
              required
            >
              <UInput
                id="confirmPassword"
                v-model="state.confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                color="secondary"
                class="w-full"
              />
            </UFormField>

            <div class="pt-4">
              <UButton
                type="submit"
                color="secondary"
                variant="solid"
                block
                :loading="submitButtonLoading"
                class="w-full max-w-md"
              >
                Registrovat
              </UButton>
            </div>
          </UForm>
        </div>
      </template>

      <template #footer>
        <p class="text-sm text-center text-gray-500">
          Máte již účet?
          <NuxtLink to="/login" class="text-blue-600 hover:underline"
            >Přihlaste se</NuxtLink
          >
        </p>
      </template>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import * as z from 'zod';
import type { FormSubmitEvent } from '@nuxt/ui';
import type { User } from '@supabase/supabase-js';

type Schema = z.output<typeof schema>;
interface Profile {
  id: string;
  username: string;
}

definePageMeta({ layout: 'dialog' });

/**
 * Holds the form state and validation schema for user registration.
 */
const formRef = useTemplateRef('form');
const schema = z
  .object({
    email: z.string().email('Zadejte platnou e-mailovou adresu.'),
    username: z.string().min(3, 'Uživatelské jméno musí mít alespoň 3 znaky.'),
    password: z.string().min(6, 'Heslo musí mít alespoň 6 znaků.'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Hesla se neshodují.',
    path: ['confirmPassword'],
  });

const state = reactive<Schema>({
  email: '',
  username: '',
  password: '',
  confirmPassword: '',
});

/**
 * Supabase client instance for interacting with the database.
 */
const supabase = useSupabaseClient<{
  profiles: Profile;
}>();

/**
 * Checks if a user with the given username already exists in the database.
 *
 * @param username - The username to check for existence.
 * @returns A promise that resolves to true if the user exists, false otherwise.
 */
const checkIfUserExists = async (username: string): Promise<boolean> => {
  const { data: existingUser } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .single();

  return !!existingUser;
};

/**
 * Creates a new user in Supabase authentication.
 *
 * @param email - The email address of the user.
 * @param password - The password for the user.
 * @returns A promise that resolves to the created user.
 * @throws Will throw an error if the user creation fails.
 */
const createUser = async (email: string, password: string): Promise<User> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: 'http://localhost:3000/',
    },
  });

  if (error || !data.user) {
    throw createError({
      statusCode: 500,
      message: error?.message || 'Došlo k chybě při registraci.',
      statusMessage: 'Internal Server Error',
    });
  }

  return data.user;
};

/**
 * Creates a new user profile in the database.
 *
 * @param userId - The ID of the user to create a profile for.
 * @param username - The username for the new profile.
 * @returns A promise that resolves when the profile is created.
 * @throws Will throw an error if the profile creation fails.
 */
const createProfile = async (
  userId: string,
  username: string
): Promise<boolean> => {
  const { error } = await supabase.from('profiles').insert({
    id: userId,
    username,
  });

  if (error) {
    if (error.code === '23503') {
      formRef.value?.setErrors(
        [{ name: 'email', message: 'Zadaný email nelze použít.' }],
        'email'
      );
      return false;
    }

    throw createError({
      statusCode: 500,
      message: 'Došlo k chybě při vytváření profilu.',
      statusMessage: 'Internal Server Error',
    });
  }

  return true;
};

/**
 * Handles the loading state of the submit button.
 */
const submitButtonLoading = ref(false);

/**
 * Indicates whether the registration was successful.
 * If true, a success message is displayed.
 */
const registrationSuccess = ref(false);

/**
 * Handles the registration form submission.
 * Validates the form, checks if the username is available,
 * creates a new user and profile, and navigates to the login page.
 *
 * @param _event - The form submit event.
 * @returns A promise that resolves when the registration is complete.
 * @throws Will throw an error if the registration fails.
 */
const handleRegister = async (
  _event: FormSubmitEvent<Schema>
): Promise<void> => {
  submitButtonLoading.value = true;

  try {
    const userExists = await checkIfUserExists(state.username);
    if (userExists) {
      formRef.value?.setErrors(
        [{ name: 'username', message: 'Uživatelské jméno je již obsazené.' }],
        'username'
      );
      return;
    }

    const user = await createUser(state.email, state.password);
    const profile = await createProfile(user.id, state.username);

    if (!user || !profile) {
      return;
    }

    registrationSuccess.value = true;
  } finally {
    submitButtonLoading.value = false;
  }
};
</script>
