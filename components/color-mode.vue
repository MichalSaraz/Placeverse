<template>
  <ClientOnly v-if="!colorMode?.forced">
    <UTooltip :text="isDark ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'">
      <UButton
        :icon="isDark ? 'i-lucide-moon' : 'i-lucide-sun'"
        color="neutral"
        variant="ghost"
        class="cursor-pointer"
        @click="isDark = !isDark"
      />
    </UTooltip>
    <template #fallback>
      <div class="size-8" />
    </template>
  </ClientOnly>
</template>
<script setup>
const colorMode = useColorMode();

const isDark = computed({
  get() {
    return colorMode.value === 'dark';
  },
  set(_isDark) {
    colorMode.preference = _isDark ? 'dark' : 'light';
  },
});
</script>
