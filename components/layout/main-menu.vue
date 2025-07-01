<template>
  <header
    class="container flex flex-row w-full h-16 items-center gap-x-8 mx-auto"
  >
    <div>
      <img src="/img/logo.svg" alt="Logo" class="h-24 w-24" />
    </div>
    <div class="w-full">
      <UNavigationMenu :items="items" />
    </div>
  </header>
</template>
<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';

const items = ref<NavigationMenuItem[][]>([
  [
    {
      label: 'Guide',
      icon: 'i-lucide-book-open',
      to: '/getting-started',
    },
    {
      label: 'Composables',
      icon: 'i-lucide-database',
      to: '/composables',
    },
  ],
  [
    {
      label: 'Logout',
      icon: 'i-lucide-log-out',
      to: '/logout',
    },
  ],
]);
</script>
