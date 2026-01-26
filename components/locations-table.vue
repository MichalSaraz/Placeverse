<template>
  <div>
    <UTable
      v-if="!isSearching || filteredLocations.length > 0"
      :data="paginatedLocations"
      :columns="columns"
      class="w-full"
      :ui="{
        td: 'px-2 py-2 text-sm',
        th: 'px-2 py-2 text-sm font-medium',
      }"
      @select="() => {}"
    >
      <template #main_photo_url-cell="{ row }">
        <nuxt-link :to="`/location/${row.original.id}`">
          <UAvatar :src="row.original.main_photo_url || ''" :alt="row.original.name" size="md" />
        </nuxt-link>
      </template>

      <template #name-cell="{ row }">
        <UTooltip :text="row.original.name">
          <nuxt-link :to="`/location/${row.original.id}`" class="hover:underline">
            {{ shortenString(row.original.name) }}
          </nuxt-link>
        </UTooltip>
      </template>

      <template #location-cell="{ row }">
        <div class="flex gap-x-2 items-center">
          <div v-if="row.original.map_url">
            <ShowMapButton :url="row.original.map_url" />
          </div>
          <UTooltip :text="row.original.location">
            <span>{{ shortenString(row.original.location) }}</span>
          </UTooltip>
        </div>
      </template>

      <template #visited-cell="{ row }">
        <div class="flex justify-center">
          <VisitedIndicator :visited="row.original.visited" />
        </div>
      </template>

      <template #web_url-cell="{ row }">
        <div class="flex space-x-2">
          <template v-for="link in getSocialLinks(row.original)" :key="link.key">
            <UButton
              v-if="link.url"
              :href="link.url"
              target="_blank"
              :icon="link.icon"
              :title="link.title"
              variant="soft"
              size="sm"
              color="secondary"
            />
          </template>
        </div>
      </template>

      <template #actions-cell="{ row }">
        <div class="flex gap-x-2">
          <UTooltip text="Zobrazit detail">
            <UButton
              :to="`/location/${row.original.id}`"
              icon="i-heroicons-eye"
              size="sm"
              color="secondary"
              variant="outline"
            />
          </UTooltip>
          <UTooltip text="Upravit lokalitu">
            <UButton
              :to="`/location/edit/${row.original.id}`"
              icon="i-heroicons-pencil"
              size="sm"
              color="warning"
              variant="outline"
            />
          </UTooltip>
          <UTooltip text="Smazat lokalitu">
            <UButton
              icon="i-heroicons-trash"
              size="sm"
              color="error"
              variant="outline"
              @click="$emit('remove-location', row.original.id, row.original.name)"
            />
          </UTooltip>
        </div>
      </template>
    </UTable>

    <div v-if="totalItems > itemsPerPage" class="mt-6 flex justify-center">
      <UPagination
        :page="currentPage"
        variant="soft"
        active-color="secondary"
        :total="totalItems"
        :items-per-page="itemsPerPage"
        @update:page="$emit('update:current-page', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import type { ProcessedLocation } from '~/types/location';
import { getResourceIconAndTitle } from '~/utils/getResourceIconAndTitle';
import { shortenString } from '~/utils/stringUtils';

interface Props {
  isSearching: boolean;
  filteredLocations: ProcessedLocation[];
  paginatedLocations: ProcessedLocation[];
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
}

interface Emit {
  'remove-location': [id: string, name: string];
  'update:current-page': [page: number];
}

defineProps<Props>();
defineEmits<Emit>();

/**
 * Table columns configuration
 */
const columns: TableColumn<ProcessedLocation>[] = [
  {
    accessorKey: 'main_photo_url',
    header: 'Foto',
  },
  {
    accessorKey: 'name',
    header: 'Název',
  },
  {
    accessorKey: 'location',
    header: 'Lokalita',
  },
  {
    accessorKey: 'category_name',
    header: 'Kategorie',
  },
  {
    accessorKey: 'visited',
    header: 'Navštíveno',
  },
  {
    accessorKey: 'web_url',
    header: 'Odkazy',
  },
  {
    accessorKey: 'actions',
    header: 'Akce',
  },
];

/**
 * Returns social links for a location
 */
function getSocialLinks(row: ProcessedLocation) {
  return [
    {
      key: 'web',
      url: row.web_url,
      ...getResourceIconAndTitle('web'),
    },
    {
      key: 'facebook',
      url: row.facebook_url,
      ...getResourceIconAndTitle('facebook'),
    },
    {
      key: 'instagram',
      url: row.instagram_url,
      ...getResourceIconAndTitle('instagram'),
    },
    {
      key: 'youtube',
      url: row.youtube_url,
      ...getResourceIconAndTitle('youtube'),
    },
  ];
}
</script>
