// middleware/auth.ts
export default defineNuxtRouteMiddleware(async () => {
  const supabase = useSupabaseClient();

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw createError(error);
  }

  return navigateTo('/login');
});
