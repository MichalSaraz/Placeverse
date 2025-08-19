<template>
  <UIcon
    v-if="props.visited"
    name="i-heroicons-check-circle-20-solid"
    class="w-6 h-6 text-green-500"
  />
  <UIcon v-else name="i-heroicons-x-circle-20-solid" class="w-6 h-6 text-gray-400" />
</template>

<script lang="ts" setup>
interface Props {
  /**
   * Indicates whether the location has been visited.
   */
  visited: boolean;
}

const props = defineProps<Props>();
</script>
