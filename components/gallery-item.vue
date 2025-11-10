<template>
  <div
    :key="photo.id"
    class="relative overflow-hidden transition-transform duration-150 transform border rounded bg-slate-400 dark:bg-slate-800 group hover:scale-105"
  >
    <div
      class="absolute z-40 p-1 transition duration-150 rounded-full opacity-0 pointer-events-none left-2 bottom-2 drag-handle cursor-grab group-hover:opacity-100 group-hover:pointer-events-auto bg-slate-900/80 hover:bg-slate-900/50"
    >
      <UIcon
        name="i-lucide-grip-vertical"
        class="w-6 h-6 text-gray-400 stroke-gray-400 fill-gray-400 drop-shadow-md"
      />
    </div>

    <img :src="photo.photo_url" class="object-cover w-full h-32" :alt="photo.id" />

    <div
      class="absolute flex gap-2 transition-opacity opacity-0 top-2 right-2 group-hover:opacity-100"
    >
      <UButton
        v-if="!photo.is_main"
        size="xs"
        variant="ghost"
        color="warning"
        class="p-1 rounded-full cursor-pointer bg-white/70 dark:bg-slate-800"
        aria-label="Nastavit jako hlavní"
        icon="i-lucide-star"
        @click.stop="onSetMain"
      />

      <UButton
        size="xs"
        variant="ghost"
        color="error"
        class="p-1 rounded-full cursor-pointer bg-white/70 dark:bg-slate-800"
        aria-label="Smazat fotografii"
        icon="i-lucide-trash"
        @click.stop="onDelete"
      />
    </div>

    <UBadge
      v-if="photo.is_main"
      class="absolute text-yellow-800 bg-yellow-100 shadow top-2 left-2"
      icon="i-lucide-star"
    >
      Hlavní
    </UBadge>
  </div>
</template>

<script setup lang="ts">
interface Props {
  photo: Photo;
}

interface Photo {
  id: string;
  photo_url: string;
  is_main: boolean;
  position?: number;
}

interface Emits {
  (e: 'set-main' | 'delete', id: string): void;
}

const props = defineProps<Props>();

const emit = defineEmits<Emits>();

function onSetMain() {
  emit('set-main', props.photo.id);
}

function onDelete() {
  emit('delete', props.photo.id);
}
</script>
