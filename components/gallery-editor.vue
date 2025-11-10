<template>
  <div class="space-y-4">
    <div v-if="loading" class="py-6 text-center">Načítání...</div>

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
          <GalleryItem :photo="p" @set-main="setAsMain" @delete="confirmDelete" />
        </template>
      </draggable>

      <div v-else class="text-sm text-muted">Zatím žádné fotky.</div>
    </div>

    <div class="pt-2">
      <GalleryUploader :previews="previews" @files="handleFilesFromChild" />
    </div>

    <GalleryActions
      :has-unsaved="hasUnsavedChanges()"
      :saving="saving"
      @cancel="cancelChanges"
      @save="saveChanges"
    />
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable';
import type { Database } from '~/types/supabase';
import GalleryItem from '~/components/gallery-item.vue';
import GalleryUploader from '~/components/gallery-uploader.vue';
import GalleryActions from '~/components/gallery-actions.vue';

interface Props {
  locationId?: string;
}

interface Photo {
  id: string;
  photo_url: string;
  is_main: boolean;
  position?: number;
}

/**
 * Component props with defaults.
 */
const props = withDefaults(defineProps<Props>(), {
  locationId: '',
});

/**
 * Component emits.
 * - 'saved' emitted after successful save
 * - 'cancel' emitted when changes were cancelled
 */
const emit = defineEmits(['saved', 'cancel'] as const);

/**
 * Supabase client instance used for storage / DB operations.
 */
const supabase = useSupabaseClient<Database>();

/**
 * Reactive flags for lifecycle and operations.
 */
const loading = ref(false);
const saving = ref(false);

/**
 * Editable collections.
 */
const photos = ref<Photo[]>([]);
const originalPhotos = ref<Photo[]>([]);

/**
 * Staging for newly added files before upload.
 */
const newFilesMeta = ref<Array<{ file: File; tempId: string; objectUrl?: string }>>([]);

/**
 * Derived previews array for template (object URLs of staged files).
 */
const previews = computed(
  () => newFilesMeta.value.map((m) => m.objectUrl).filter(Boolean) as string[]
);

/**
 * Staging state for deletions and main-photo selection.
 * - deletedIds: IDs of existing DB photos staged for deletion.
 * - mainTempId: temporary id for newly added (not yet uploaded) photo selected as main.
 * - mainExistingId: existing DB id selected as main.
 */
const deletedIds = ref<string[]>([]);
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
 * Handle files emitted from child uploader component.
 * @param {File[]} files - Array of File objects to stage for upload
 */
function handleFilesFromChild(files: File[]) {
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
async function loadPhotos() {
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
      .select('id, photo_url, is_main, position')
      .eq('location_id', props.locationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Failed to load photos', error);
      photos.value = [];
      originalPhotos.value = [];
    } else {
      // store raw data
      originalPhotos.value = (data || []) as Photo[];

      // if backend provides a numeric `position`, use it to order photos in the editor
      if (
        originalPhotos.value.some(
          (p) => typeof (p as Photo & { position?: number }).position === 'number'
        )
      ) {
        originalPhotos.value.sort(
          (a, b) =>
            (Number((a as Photo & { position?: number }).position) || 0) -
            (Number((b as Photo & { position?: number }).position) || 0)
        );
      }

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
 * Upload staged files sequentially.
 * @param {string} userId - current user id used for storage path
 * @returns {{ Map<string,string>, Map<string,string> }} two maps linking local staged entries
 * to their uploaded public URLs and to their DB ids
 */
async function uploadNewFiles(userId: string) {
  const tempToPublic = new Map<string, string>();
  const tempToRowId = new Map<string, string>();

  for (const meta of newFilesMeta.value) {
    const { file, tempId } = meta;
    const res = await uploadFile(file, userId);
    if (res && res.publicUrl) tempToPublic.set(tempId, res.publicUrl);
    if (res && res.row && (res.row as { id?: number | string }).id)
      tempToRowId.set(tempId, String((res.row as { id?: number | string }).id));
  }

  return { tempToPublic, tempToRowId };
}

/**
 * Delete staged photos (existing DB rows).
 */
async function deleteStagedPhotos() {
  for (const id of deletedIds.value) {
    await supabase.from('photos').delete().eq('id', id);
  }
}

/**
 * Resolve final DB ids from the user's desired order (handles "new-..." temp ids).
 * @param {string[]} desiredOrder - photo ids (may include "new-..." temporary ids)
 * @param {Map<string,string>} tempToPublic - map tempId -> uploaded public URL
 * @returns {string[]} resolved DB photo ids (unresolved entries omitted)
 */
function resolveFinalIdOrder(desiredOrder: string[], tempToPublic: Map<string, string>) {
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

  return finalIdOrder;
}

/**
 * Set the given DB photo id as the main photo for this location.
 * Clears any existing main flag for the location before setting the new one.
 * @param {string | null} desiredMainId - DB id to mark as main (no-op if null)
 */
async function applyMainSelection(desiredMainId: string | null) {
  if (!desiredMainId) return;

  await supabase
    .from('photos')
    .update({ is_main: false })
    .eq('location_id', props.locationId)
    .eq('is_main', true);
  await supabase.from('photos').update({ is_main: true }).eq('id', desiredMainId);
}

/**
 * If no main photo is currently selected (or the selected main was deleted),
 * promote the first id from finalIdOrder as the new main photo.
 * @param {string | null} desiredMainId - currently desired DB id for main (may be null)
 * @param {string[]} finalIdOrder - resolved DB ids in desired order (first element used as fallback)
 */
async function ensureFallbackMain(desiredMainId: string | null, finalIdOrder: string[]) {
  if (desiredMainId && photos.value.some((p) => p.id === desiredMainId)) return;

  if (finalIdOrder.length > 0) {
    const fallbackId = finalIdOrder[0];
    if (fallbackId) {
      await supabase
        .from('photos')
        .update({ is_main: false })
        .eq('location_id', props.locationId)
        .eq('is_main', true);
      await supabase.from('photos').update({ is_main: true }).eq('id', fallbackId);
    }
  }
}

/**
 * Update photo positions in the backend according to finalIdOrder.
 * Runs only when photos include a numeric `position` field.
 * @param {string[]} finalIdOrder - Resolved DB photo ids in desired order
 */
async function updatePositions(finalIdOrder: string[]) {
  const supportsPosition =
    photos.value.length > 0 && Object.prototype.hasOwnProperty.call(photos.value[0], 'position');

  if (supportsPosition && finalIdOrder.length > 0) {
    for (let i = 0; i < finalIdOrder.length; i++) {
      const id = finalIdOrder[i];
      await supabase.from('photos').update({ position: i }).eq('id', id);
    }
  }
}

/**
 * Save staged changes:
 * - upload new files
 * - delete staged rows
 * - resolve ids and set main photo
 * - update positions, reload and clear staging
 */
async function saveChanges() {
  if (!props.locationId) return;

  saving.value = true;
  try {
    const user = useSupabaseUser();
    if (!user.value) throw new Error('Uživatel není přihlášen');

    const desiredOrder = photos.value.map((p) => p.id);

    const { tempToPublic, tempToRowId } = await uploadNewFiles(user.value.id);

    await deleteStagedPhotos();

    const selectedMainExisting = mainExistingId.value;
    const selectedMainTemp = mainTempId.value;

    // reload to get inserted rows and fresh state
    await loadPhotos();

    const finalIdOrder = resolveFinalIdOrder(desiredOrder, tempToPublic);

    // determine desired main id
    let desiredMainId: string | null = null;
    if (selectedMainExisting) {
      desiredMainId = selectedMainExisting;
    } else if (selectedMainTemp) {
      const rowId = tempToRowId.get(selectedMainTemp);
      if (rowId) desiredMainId = rowId;
      else {
        const publicUrl = tempToPublic.get(selectedMainTemp);
        if (publicUrl) {
          const found = photos.value.find((p) => p.photo_url === publicUrl);
          if (found) desiredMainId = found.id;
        }
      }
    }

    await applyMainSelection(desiredMainId);
    await ensureFallbackMain(desiredMainId, finalIdOrder);
    await updatePositions(finalIdOrder);

    clearStaged();
    await loadPhotos();
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
  () => loadPhotos(),
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
 * @param {Promise<boolean>} requestClose — ask component if it's safe to close (handles unsaved changes).
 */
defineExpose({ requestClose });
</script>
