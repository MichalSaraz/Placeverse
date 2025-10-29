<template>
  <div class="space-y-4">
    <div v-if="loading" class="text-center py-6">Načítání...</div>

    <div v-else>
      <draggable
        v-if="photos.length"
        v-model="photos"
        item-key="id"
        handle=".drag-handle"
        :animation="200"
        class="grid grid-cols-3 gap-3"
      >
        <template #item="{ element: p }">
          <div
            :key="p.id"
            class="relative border rounded overflow-hidden bg-slate-400 dark:bg-slate-800 group transform transition-transform duration-150 hover:scale-105"
          >
            <div
              :class="[
                'absolute',
                'left-2',
                'bottom-2',
                'drag-handle',
                'cursor-grab',
                'p-1',
                'z-40',
                'rounded-full',
                'opacity-0',
                'group-hover:opacity-100',
                'transition',
                'duration-150',
                'pointer-events-none',
                'group-hover:pointer-events-auto',
                'bg-slate-900/80',
                'hover:bg-slate-900/50',
              ]"
            >
              <UIcon
                name="i-lucide-grip-vertical"
                class="w-6 h-6 text-gray-400 stroke-gray-400 fill-gray-400 drop-shadow-md"
              />
            </div>

            <img :src="p.photo_url" class="w-full h-32 object-cover" :alt="p.id" />

            <div
              class="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <UButton
                v-if="!p.is_main"
                size="xs"
                variant="ghost"
                color="warning"
                class="rounded-full p-1 bg-white/70 dark:bg-slate-800 cursor-pointer"
                aria-label="Nastavit jako hlavní"
                @click="setAsMain(p.id)"
              >
                <UIcon name="i-lucide-star" class="w-4 h-4 text-yellow-500" />
              </UButton>

              <UButton
                size="xs"
                variant="ghost"
                color="error"
                class="rounded-full p-1 bg-white/70 dark:bg-slate-800 cursor-pointer"
                aria-label="Smazat fotografii"
                @click="confirmDelete(p.id)"
              >
                <UIcon name="i-lucide-trash" class="w-4 h-4" />
              </UButton>
            </div>

            <div
              v-if="p.is_main"
              class="absolute top-2 left-2 flex items-center gap-1 bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 rounded shadow"
            >
              <UIcon name="i-lucide-star" class="w-3 h-3" />
              <span>Hlavní</span>
            </div>
          </div>
        </template>
      </draggable>

      <div v-else class="text-sm text-muted">Zatím žádné fotky.</div>
    </div>

    <div class="pt-2">
      <div class="flex items-center gap-3">
        <UButton color="secondary" class="cursor-pointer" @click="triggerFileInput">
          Přidat fotografie
        </UButton>
        <input
          ref="fileInput"
          type="file"
          multiple
          accept="image/*"
          class="hidden"
          @change="handleFiles"
        />
        <div v-if="previews.length" class="flex gap-2 items-center">
          <div v-for="(p, i) in previews" :key="i" class="w-16 h-16 border rounded overflow-hidden">
            <img :src="p" class="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-2 pt-4">
      <UButton
        color="neutral"
        variant="ghost"
        :disabled="!hasUnsavedChanges()"
        :class="!hasUnsavedChanges() ? 'cursor-not-allowed' : 'cursor-pointer'"
        aria-label="Vrátit změny"
        @click="cancelChanges"
      >
        Vrátit změny
      </UButton>
      <UButton color="primary" :loading="saving" class="cursor-pointer" @click="saveChanges">
        Uložit změny
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed } from 'vue';
import draggable from 'vuedraggable';
import type { Database } from '~/types/supabase';

/**
 * Component props.
 * @typedef {Object} Props
 * @property {string} [locationId] - Id of the location whose photos are edited. Empty when not provided.
 */
const props = withDefaults(defineProps<{ locationId?: string }>(), {
  locationId: '',
});

/**
 * Component emits.
 * - 'saved' emitted after successful save
 * - 'cancel' emitted when changes were cancelled
 */
const emit = defineEmits(['saved', 'cancel'] as const);

/**
 * Photo model stored in component state.
 * @typedef {Object} Photo
 * @property {string} id - Unique id (existing DB id or temporary 'new-...' id).
 * @property {string} photo_url - Public URL or object URL for preview.
 * @property {boolean} is_main - Whether this photo is marked as main.
 * @property {number} [position] - Optional ordering field from backend.
 */
type Photo = { id: string; photo_url: string; is_main: boolean; position?: number };

/**
 * Supabase client instance used for storage / DB operations.
 */
const supabase = useSupabaseClient<Database>();

/**
 * Reactive flags for lifecycle and operations.
 * - loading: true while photos are being fetched from backend.
 * - saving: true while saveChanges() is performing uploads/DB updates.
 */
const loading = ref(false);
const saving = ref(false);

/**
 * Editable collections.
 * - photos: current, editable list shown in UI (includes temp new items).
 * - originalPhotos: snapshot loaded from backend used for revert.
 */
const photos = ref<Photo[]>([]);
const originalPhotos = ref<Photo[]>([]);

/**
 * Staging for newly added files before upload.
 * Each entry contains the File, a generated tempId and an objectUrl used for preview.
 */
const newFilesMeta = ref<Array<{ file: File; tempId: string; objectUrl?: string }>>([]);

/**
 * Derived previews array for template (object URLs of staged files).
 * This is computed to avoid duplicate state.
 */
const previews = computed(
  () => newFilesMeta.value.map((m) => m.objectUrl).filter(Boolean) as string[]
);

/**
 * Reference to hidden file input element used to trigger file picker.
 */
const fileInput = ref<HTMLInputElement | null>(null);

/**
 * IDs of existing photos staged for deletion (DB rows).
 */
const deletedIds = ref<string[]>([]);

/**
 * Staged selection of "main" photo.
 * - mainTempId: temp id for newly added (not yet uploaded) photo
 * - mainExistingId: existing DB id of a photo selected as main
 */
const mainTempId = ref<string | null>(null);
const mainExistingId = ref<string | null>(null);

/**
 * Deep clone helper for plain data.
 * Uses JSON-based clone (sufficient for this data shape: strings/booleans/arrays).
 * @template T
 * @param {T} v - Value to clone
 * @returns {T} - Deep-cloned value
 */
function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

/**
 * Revoke object URLs created for previews to avoid memory leaks.
 * Silently logs failure in non-production (defensive).
 */
function revokeNewPreviews() {
  for (const m of newFilesMeta.value) {
    if (!m.objectUrl) continue;

    try {
      URL.revokeObjectURL(m.objectUrl);
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Failed to revoke object URL', e);
      }
    }
  }
}

/**
 * Clear staged state (new files, deletions and main selection).
 * Also revokes any created object URLs.
 */
function clearStaged() {
  revokeNewPreviews();
  newFilesMeta.value = [];
  deletedIds.value = [];
  mainTempId.value = null;
  mainExistingId.value = null;
}

/**
 * Determine whether there are unsaved changes.
 * Considers:
 * - staged new files
 * - staged deletions
 * - changes to existing photos order or main flag (compares originalPhotos vs photos)
 * @returns {boolean} - true if there are unsaved changes
 */
function hasUnsavedChanges() {
  if (newFilesMeta.value.length > 0) return true;
  if (deletedIds.value.length > 0) return true;

  const orig = originalPhotos.value.map((p) => ({ id: p.id, is_main: !!p.is_main }));
  const curr = photos.value
    .filter((p) => !p.id.startsWith('new-'))
    .map((p) => ({ id: p.id, is_main: !!p.is_main }));

  if (orig.length !== curr.length) return true;

  for (let i = 0; i < orig.length; i++) {
    if (orig[i].id !== curr[i].id) return true;
    if (orig[i].is_main !== curr[i].is_main) return true;
  }

  return false;
}

/**
 * Open file picker by triggering hidden input.
 */
function triggerFileInput() {
  fileInput.value?.click();
}

/**
 * Handle files selected in file input.
 * Creates object URLs for previews, stages files and adds preview items to photos array.
 * @param {Event} e - change event from file input
 */
function handleFiles(e: Event) {
  const input = e.target as HTMLInputElement;
  if (!input.files) return;

  const files = Array.from(input.files);

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const tempId =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? `new-${crypto.randomUUID()}`
        : `new-${Date.now()}-${i}`;
    const objectUrl = URL.createObjectURL(f);

    newFilesMeta.value.push({ file: f, tempId, objectUrl });
    photos.value.push({ id: tempId, photo_url: objectUrl, is_main: false });
  }
}

/**
 * Confirm and stage deletion of a photo.
 * If photo is a staged (new) item, it gets removed entirely.
 * @param {string} photoId - id of photo to delete
 */
async function confirmDelete(photoId: string) {
  if (!confirm('Opravdu chcete fotku smazat?')) return;

  if (photoId.startsWith('new-')) {
    newFilesMeta.value = newFilesMeta.value.filter((m) => m.tempId !== photoId);
    photos.value = photos.value.filter((p) => p.id !== photoId);
    return;
  }

  deletedIds.value.push(photoId);
  photos.value = photos.value.filter((p) => p.id !== photoId);
}

/**
 * Mark the given photo as main in staged state.
 * Updates photos[] and sets appropriate staged main id.
 * @param {string} photoId
 */
function setAsMain(photoId: string) {
  photos.value = photos.value.map((p) => ({ ...p, is_main: p.id === photoId }));

  if (photoId.startsWith('new-')) {
    mainTempId.value = photoId;
    mainExistingId.value = null;
  } else {
    mainExistingId.value = photoId;
    mainTempId.value = null;
  }
}

/**
 * Upload a single file to Supabase storage and insert DB record.
 * @param {File} file - File to upload
 * @param {string} userId - Id of the current user (used for file path)
 * @returns {Promise<{publicUrl: string; row: any}>} - Uploaded file public URL and DB row
 */
async function uploadFile(file: File, userId: string) {
  const filePath = `user-${userId}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from('location-photos')
    .upload(filePath, file);

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('location-photos').getPublicUrl(filePath);

  const { data, error: insertError } = await supabase
    .from('photos')
    .insert({
      location_id: props.locationId,
      photo_url: publicUrl,
      is_main: false,
      created_at: new Date().toISOString(),
    })
    .select();

  if (insertError) throw insertError;

  return { publicUrl, row: data && data[0] };
}

/**
 * Load photos for the current props.locationId from backend.
 * On success sets originalPhotos and photos (deep-cloned), and clears staged state.
 */
async function load() {
  if (!props.locationId) {
    photos.value = [];
    originalPhotos.value = [];
    clearStaged();
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    const { data, error } = await supabase
      .from('photos')
      .select('id, photo_url, is_main')
      .eq('location_id', props.locationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load photos', error);
      photos.value = [];
      originalPhotos.value = [];
    } else {
      originalPhotos.value = (data || []) as Photo[];
      photos.value = deepClone(originalPhotos.value);
      clearStaged();
    }
  } catch (err) {
    console.error('Unexpected error loading photos', err);
    photos.value = [];
    originalPhotos.value = [];
  } finally {
    loading.value = false;
  }
}

/**
 * Save staged changes:
 * - upload new files
 * - delete staged deletions
 * - update main flag and positions in DB
 * - reload final state and clear staging
 */
async function saveChanges() {
  if (!props.locationId) return;

  saving.value = true;
  try {
    const user = useSupabaseUser();
    if (!user.value) throw new Error('Uživatel není přihlášen');

    const desiredOrder = photos.value.map((p) => p.id);
    const tempToPublic = new Map<string, string>();

    for (const meta of newFilesMeta.value) {
      const { file, tempId } = meta;
      const res = await uploadFile(file, user.value.id);
      if (res && res.publicUrl) tempToPublic.set(tempId, res.publicUrl);
    }

    for (const id of deletedIds.value) {
      await supabase.from('photos').delete().eq('id', id);
    }

    await load();
    const finalIdOrder: string[] = [];

    for (const entry of desiredOrder) {
      if (entry.startsWith('new-')) {
        const publicUrl = tempToPublic.get(entry);
        if (!publicUrl) continue;

        const found = photos.value.find((p) => p.photo_url === publicUrl);
        if (found) finalIdOrder.push(found.id);
      } else {
        const found = photos.value.find((p) => p.id === entry);
        if (found) finalIdOrder.push(found.id);
      }
    }

    let desiredMainId: string | null = null;

    if (mainExistingId.value) {
      desiredMainId = mainExistingId.value;
    } else if (mainTempId.value) {
      const publicUrl = tempToPublic.get(mainTempId.value);

      if (publicUrl) {
        const found = photos.value.find((p) => p.photo_url === publicUrl);
        if (found) desiredMainId = found.id;
      }
    }

    if (desiredMainId) {
      await supabase
        .from('photos')
        .update({ is_main: false })
        .eq('location_id', props.locationId)
        .eq('is_main', true);
      await supabase.from('photos').update({ is_main: true }).eq('id', desiredMainId);
    }

    const supportsPosition =
      photos.value.length > 0 && Object.prototype.hasOwnProperty.call(photos.value[0], 'position');

    if (supportsPosition && finalIdOrder.length > 0) {
      for (let i = 0; i < finalIdOrder.length; i++) {
        const id = finalIdOrder[i];
        await supabase.from('photos').update({ position: i }).eq('id', id);
      }
    }

    clearStaged();
    await load();
    emit('saved');
  } catch (err) {
    console.error('Failed saving gallery', err);
    alert('Došlo k chybě při ukládání změn v galerii.');
  } finally {
    saving.value = false;
  }
}

/**
 * Cancel staged changes and notify parent.
 * If there are unsaved changes asks user for confirmation.
 */
async function cancelChanges() {
  if (!hasUnsavedChanges()) return;

  const ok = confirm('Máte neuložené změny. Opravdu je chcete zahodit?');
  if (!ok) return;

  photos.value = deepClone(originalPhotos.value);
  clearStaged();
}

/**
 * Called by parent before closing the modal. Returns true when it's safe to close.
 * If there are unsaved changes, asks the user whether to save or discard.
 * @returns {Promise<boolean>} - true if it's safe to close
 */
async function requestClose() {
  if (!hasUnsavedChanges()) return true;

  const ok = confirm('Opravdu chcete okno zavřít? Změny nebudou uloženy');
  if (ok) {
    photos.value = deepClone(originalPhotos.value);
    clearStaged();
    return true;
  }
  return false;
}

/**
 * Reload photos when locationId changes (immediate).
 */
watch(
  () => props.locationId,
  () => load(),
  { immediate: true }
);

/**
 * Cleanup object URLs created for previews to avoid memory leaks when the component unmounts.
 */
onBeforeUnmount(() => {
  revokeNewPreviews();
});

/**
 * Expose a minimal public API to parent components.
 * - requestClose(): Promise<boolean> — ask component if it's safe to close (handles unsaved changes).
 */
defineExpose({ requestClose });
</script>
