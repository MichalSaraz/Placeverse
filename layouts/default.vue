<template>
  <div>
    <LayoutMainMenu />
    <UContainer>
      <slot />
    </UContainer>

    <SearchModal v-model="showSearchModal" />
  </div>
</template>

<script setup lang="ts">
const showSearchModal = ref(false);

provide('searchModal', {
  show: showSearchModal,
  open: () => {
    showSearchModal.value = true;
  },
  close: () => {
    showSearchModal.value = false;
  },
});

/**
 * Keyboard shortcut to open search modal
 */
defineShortcuts({
  meta_k: () => {
    showSearchModal.value = true;
  },
});
</script>
