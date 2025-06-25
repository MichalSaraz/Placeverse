<template>
  <div class="flex items-center justify-center w-full h-full">
    <div class="w-full max-w-6xl">
      <NuxtErrorBoundary>
        <slot />
        <template #error="{ error, clearError }">
          <UAlert title="Error" color="error" :description="error.message">
            <template #actions>
              <UButton @click="clearError">Clear</UButton>
            </template>
          </UAlert>
        </template>
      </NuxtErrorBoundary>
    </div>
  </div>
</template>
