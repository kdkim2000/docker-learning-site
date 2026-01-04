<template>
  <!-- Mobile overlay -->
  <div
    v-if="open"
    class="fixed inset-0 z-40 bg-black/50 lg:hidden"
    @click="$emit('close')"
  />

  <!-- Sidebar -->
  <aside
    :class="[
      'fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 overflow-y-auto scrollbar-thin',
      'transition-transform duration-300 lg:translate-x-0',
      open ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <nav class="p-4">
      <!-- Overall progress -->
      <div class="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div class="flex justify-between text-sm mb-2">
          <span class="font-medium">학습 진도</span>
          <span class="text-docker-blue font-bold">{{ store.progressPercentage }}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-bar-fill" :style="{ width: `${store.progressPercentage}%` }" />
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {{ store.completedChapters }}개 완료 / {{ store.totalChapters }}개 챕터
        </p>
      </div>

      <!-- Chapters list -->
      <div class="space-y-1">
        <h3 class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          목차
        </h3>

        <NuxtLink
          v-for="chapter in CHAPTERS"
          :key="chapter.slug"
          :to="`/chapters/${chapter.slug}`"
          :class="[
            'sidebar-link',
            isActive(chapter.slug) && 'active',
            store.isChapterCompleted(chapter.slug) && !isActive(chapter.slug) && 'completed'
          ]"
          @click="$emit('close')"
        >
          <!-- Status icon -->
          <span
            :class="[
              'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium',
              store.isChapterCompleted(chapter.slug)
                ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            ]"
          >
            <svg v-if="store.isChapterCompleted(chapter.slug)" class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span v-else>{{ chapter.number }}</span>
          </span>

          <!-- Chapter title -->
          <span class="truncate">{{ chapter.title }}</span>
        </NuxtLink>
      </div>

      <!-- External links -->
      <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 class="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          실습 환경
        </h3>
        <div class="space-y-1">
          <a
            v-for="link in externalLinks"
            :key="link.url"
            :href="link.url"
            target="_blank"
            rel="noopener noreferrer"
            class="sidebar-link group"
          >
            <svg class="w-5 h-5 text-gray-400 group-hover:text-docker-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span class="truncate">{{ link.title }}</span>
          </a>
        </div>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { useLearningStore } from '~/stores/learning'
import { CHAPTERS } from '~/types'

defineProps<{
  open: boolean
}>()

defineEmits<{
  close: []
}>()

const store = useLearningStore()
const route = useRoute()

const isActive = (slug: string) => {
  return route.path === `/chapters/${slug}`
}

const externalLinks = [
  { title: 'Play with Docker', url: 'https://labs.play-with-docker.com/' },
  { title: 'Docker Hub', url: 'https://hub.docker.com/' },
  { title: 'Docker Docs', url: 'https://docs.docker.com/' },
  { title: 'Awesome Compose', url: 'https://github.com/docker/awesome-compose' }
]
</script>
