<template>
  <UIcon v-if="props.visited" name="i-heroicons-check-circle-20-solid" class="text-green-500" />
  <UIcon v-else name="i-heroicons-x-circle-20-solid" class="text-gray-400" />
</template>
<script lang="ts" setup>

interface Props {
  visited: boolean;
}

const props = defineProps<Props>();

</script>
