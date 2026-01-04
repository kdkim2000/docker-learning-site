<template>
  <NuxtLink
    :to="`/chapters/${chapter.slug}`"
    :class="[
      'flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-xl border transition-all',
      completed
        ? 'border-green-200 dark:border-green-800 hover:border-green-300 dark:hover:border-green-700'
        : 'border-gray-200 dark:border-gray-700 hover:border-docker-blue dark:hover:border-docker-blue'
    ]"
  >
    <!-- Chapter number -->
    <div
      :class="[
        'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold',
        completed
          ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      ]"
    >
      <svg v-if="completed" class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
      </svg>
      <span v-else>{{ chapter.number.toString().padStart(2, '0') }}</span>
    </div>

    <!-- Chapter info -->
    <div class="flex-1 min-w-0">
      <h3 :class="[
        'font-medium truncate',
        completed ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
      ]">
        {{ chapter.title }}
      </h3>
      <p v-if="completed" class="text-sm text-green-600 dark:text-green-400">
        완료됨
      </p>
    </div>

    <!-- Arrow -->
    <svg class="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
    </svg>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { Chapter } from '~/types'

defineProps<{
  chapter: Chapter
  completed: boolean
}>()
</script>
