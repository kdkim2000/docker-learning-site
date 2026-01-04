<template>
  <div class="max-w-4xl mx-auto px-4 py-8">
    <header class="mb-8">
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-2">
        북마크
      </h1>
      <p class="text-gray-600 dark:text-gray-400">
        저장한 섹션들을 한눈에 확인하세요.
      </p>
    </header>

    <!-- Empty state -->
    <div
      v-if="store.bookmarks.length === 0"
      class="text-center py-16"
    >
      <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      </div>
      <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        북마크가 없습니다
      </h2>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        챕터를 읽으면서 중요한 섹션을 북마크해 보세요.
      </p>
      <NuxtLink
        to="/"
        class="inline-flex items-center gap-2 px-4 py-2 bg-docker-blue text-white rounded-lg hover:bg-docker-dark transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        학습 시작하기
      </NuxtLink>
    </div>

    <!-- Bookmarks list -->
    <div v-else class="space-y-4">
      <!-- Group by chapter -->
      <div
        v-for="(bookmarks, chapterId) in groupedBookmarks"
        :key="chapterId"
        class="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
      >
        <!-- Chapter header -->
        <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <h2 class="font-medium text-gray-900 dark:text-white">
            {{ getChapterTitle(chapterId as string) }}
          </h2>
        </div>

        <!-- Bookmarks -->
        <ul class="divide-y divide-gray-100 dark:divide-gray-700">
          <li
            v-for="bookmark in bookmarks"
            :key="bookmark.id"
            class="flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <NuxtLink
              :to="`/chapters/${bookmark.chapterId}#${bookmark.sectionId}`"
              class="flex-1 min-w-0"
            >
              <h3 class="font-medium text-gray-900 dark:text-white truncate">
                {{ bookmark.title }}
              </h3>
              <p v-if="bookmark.excerpt" class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                {{ bookmark.excerpt }}
              </p>
              <time class="text-xs text-gray-400 dark:text-gray-500 mt-2 block">
                {{ formatDate(bookmark.createdAt) }}
              </time>
            </NuxtLink>

            <button
              @click="store.removeBookmark(bookmark.id)"
              class="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Remove bookmark"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </li>
        </ul>
      </div>

      <!-- Clear all button -->
      <div class="flex justify-end pt-4">
        <button
          @click="confirmClearAll"
          class="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
        >
          모든 북마크 삭제
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useLearningStore } from '~/stores/learning'
import { CHAPTERS } from '~/types'

const store = useLearningStore()

// Group bookmarks by chapter
const groupedBookmarks = computed(() => {
  const groups: Record<string, typeof store.bookmarks> = {}

  store.bookmarks.forEach((bookmark) => {
    if (!groups[bookmark.chapterId]) {
      groups[bookmark.chapterId] = []
    }
    groups[bookmark.chapterId].push(bookmark)
  })

  return groups
})

// Get chapter title
const getChapterTitle = (chapterId: string): string => {
  const chapter = CHAPTERS.find((c) => c.slug === chapterId)
  return chapter?.title || chapterId
}

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date)
}

// Confirm clear all
const confirmClearAll = () => {
  if (confirm('모든 북마크를 삭제하시겠습니까?')) {
    store.resetBookmarks()
  }
}

// SEO
useHead({
  title: '북마크 - Docker 학습'
})
</script>
