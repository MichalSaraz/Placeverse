<template>
  <div>
    <UButton color="secondary" class="cursor-pointer" @click="trigger">Přidat fotografie</UButton>
    <input ref="inputRef" type="file" multiple accept="image/*" class="hidden" @change="onChange" />

    <div v-if="previews?.length" class="flex items-center gap-2 mt-2">
      <div v-for="(p, i) in previews" :key="i" class="w-16 h-16 overflow-hidden border rounded">
        <img :src="p" class="object-cover w-full h-full" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  previews?: string[];
}

interface Emits {
  (e: 'files', files: File[]): void;
}

const { previews = [] } = defineProps<Props>();

const emit = defineEmits<Emits>();

const inputRef = ref<HTMLInputElement | null>(null);

function trigger() {
  inputRef.value?.click();
}

/**
 * Handles the change event when files are selected.
 * Emits the selected files and resets the input value.
 * @param e - The change event from the file input.
 */
function onChange(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;

  emit('files', Array.from(input.files));
  input.value = '';
}
</script>
