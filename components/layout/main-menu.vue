<template>
  <header class="flex flex-row w-full h-16 items-center justify-center gap-x-4">
    <div>
      <img src="/img/logo.svg" alt="Logo" class="h-24 w-24" />
    </div>
    <div>
      <UNavigationMenu :items="items" class="w-full" />
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
]);
</script>
