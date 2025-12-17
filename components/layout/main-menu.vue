<template>
  <header
    class="sticky top-0 bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700"
  >
    <div class="container flex w-full h-16 items-center gap-x-8 mx-auto overflow-hidden">
      <div class="overflow-hidden">
        <nuxt-link to="/">
          <img src="/img/logo_black.svg" alt="Logo" class="h-72 w-72 block dark:hidden" />
          <img src="/img/logo.svg" alt="Logo" class="h-72 w-72 hidden dark:block" />
        </nuxt-link>
      </div>

      <div class="w-full flex justify-between items-center">
        <UButton to="/" icon="i-lucide-map-pinned" color="neutral" variant="ghost">
          Moje lokality
        </UButton>

        <div class="flex items-center gap-x-4">
          <UTooltip>
            <UButton
              icon="i-heroicons-magnifying-glass-20-solid"
              color="neutral"
              variant="ghost"
              class="cursor-pointer"
              @click="openSearchModal"
            />
            <template #content>
              <div class="flex items-center gap-0.5 text-xs">
                <span class="text-xs">Vyhledat lokality</span>
                <span class="text-white/70 font-bold">·</span>
                <div class="flex items-center gap-0.5">
                  <UKbd value="meta" size="sm" />
                  <UKbd size="sm">K</UKbd>
                </div>
              </div>
            </template>
          </UTooltip>
          <ColorMode />
          <UTooltip text="Odhlásit se">
            <UButton to="/logout" icon="i-lucide-log-out" color="neutral" variant="ghost" />
          </UTooltip>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
const searchModal = inject('searchModal') as {
  show: Ref<boolean>;
  open: () => void;
  close: () => void;
};

const openSearchModal = () => {
  searchModal?.open();
};
</script>
