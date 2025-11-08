<template>
  <Teleport v-if="isMounted" :to="props.to">
    <slot></slot>
  </Teleport>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
interface Props {
  to?: string;
}

const props = withDefaults(defineProps<Props>(), {
  to: 'body',
});

const isMounted = ref(false);

onMounted(() => {
  isMounted.value = true;
});
</script>
