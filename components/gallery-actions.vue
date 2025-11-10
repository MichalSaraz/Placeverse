<template>
  <div class="flex justify-end gap-2 pt-4">
    <UButton
      color="neutral"
      variant="ghost"
      :disabled="!hasUnsaved"
      :class="!hasUnsaved ? 'cursor-not-allowed' : 'cursor-pointer'"
      aria-label="Vrátit změny"
      @click="onCancel"
    >
      Vrátit změny
    </UButton>
    <UButton color="primary" :loading="saving" class="cursor-pointer" @click="onSave">
      Uložit změny
    </UButton>
  </div>
</template>

<script setup lang="ts">
interface Props {
  hasUnsaved?: boolean;
  saving?: boolean;
}

interface Emits {
  (e: 'cancel' | 'save'): void;
}

const { hasUnsaved, saving } = defineProps<Props>();

const emit = defineEmits<Emits>();

function onCancel() {
  emit('cancel');
}

function onSave() {
  emit('save');
}
</script>
