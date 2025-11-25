<template>
  <UTooltip text="Zobrazit na mapě">
    <UButton
      :to="props.url"
      target="_blank"
      size="sm"
      color="error"
      variant="soft"
      icon="i-heroicons-map-pin"
    />
  </UTooltip>
</template>

<script setup lang="ts">
interface Props {
  /**
   * URL of the map
   */
  url: string;
}

const props = defineProps<Props>();
</script>
