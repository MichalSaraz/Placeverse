<template>
  <h1>Uživatel bude odhlášen.</h1>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'logout',
});
</script>
