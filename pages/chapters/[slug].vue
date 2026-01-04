<template>
  <div class="flex">
    <!-- Main content -->
    <article class="flex-1 min-w-0 px-4 lg:px-8 py-8">
      <div class="max-w-4xl mx-auto">
        <!-- Breadcrumb -->
        <nav class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <NuxtLink to="/" class="hover:text-docker-blue">홈</NuxtLink>
          <span>/</span>
          <span class="text-gray-900 dark:text-white">{{ currentChapter?.title }}</span>
        </nav>

        <!-- Chapter header -->
        <header class="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-start justify-between gap-4">
            <div>
              <span class="inline-block px-3 py-1 bg-docker-light dark:bg-docker-blue/20 text-docker-blue text-sm font-medium rounded-full mb-3">
                Chapter {{ currentChapter?.number?.toString().padStart(2, '0') }}
              </span>
              <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
                {{ chapter?.title }}
              </h1>
            </div>

            <!-- Completion toggle -->
            <button
              @click="toggleComplete"
              :class="[
                'flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                store.isChapterCompleted(slug)
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400'
                  : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-docker-blue'
              ]"
            >
              <svg v-if="store.isChapterCompleted(slug)" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span class="hidden sm:inline">
                {{ store.isChapterCompleted(slug) ? '완료됨' : '완료로 표시' }}
              </span>
            </button>
          </div>
        </header>

        <!-- Content -->
        <div v-if="hasJsonContent && jsonChapter" class="chapter-json-content">
          <ChapterRenderer :chapter="jsonChapter" />
        </div>
        <div v-else class="prose prose-lg dark:prose-invert max-w-none">
          <ContentRenderer v-if="chapter" :value="chapter" />
        </div>

        <!-- Chapter navigation -->
        <nav class="flex items-center justify-between mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
          <NuxtLink
            v-if="prevChapter"
            :to="`/chapters/${prevChapter.slug}`"
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-docker-blue dark:hover:text-docker-blue"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            <div class="text-right">
              <span class="block text-xs text-gray-400">이전</span>
              <span class="font-medium">{{ prevChapter.title }}</span>
            </div>
          </NuxtLink>
          <div v-else />

          <NuxtLink
            v-if="nextChapter"
            :to="`/chapters/${nextChapter.slug}`"
            class="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-docker-blue dark:hover:text-docker-blue"
          >
            <div class="text-left">
              <span class="block text-xs text-gray-400">다음</span>
              <span class="font-medium">{{ nextChapter.title }}</span>
            </div>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </NuxtLink>
          <div v-else />
        </nav>
      </div>
    </article>

    <!-- Table of Contents (desktop only) -->
    <aside class="hidden xl:block w-64 flex-shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto border-l border-gray-200 dark:border-gray-800">
      <div class="p-6">
        <h4 class="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">
          목차
        </h4>
        <!-- JSON content TOC -->
        <template v-if="hasJsonContent && jsonChapter">
          <ul class="space-y-1">
            <li
              v-for="section in jsonToc"
              :key="section.id"
              :class="{ 'pl-4': section.level === 3 }"
            >
              <a
                :href="`#${section.id}`"
                class="block py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-docker-blue transition-colors"
              >
                {{ section.title }}
              </a>
            </li>
          </ul>
        </template>
        <!-- Markdown content TOC -->
        <TableOfContents v-else-if="chapter?.body?.toc" :links="chapter.body.toc.links" />
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { useLearningStore } from '~/stores/learning'
import { CHAPTERS } from '~/types'
import type { ChapterJSON } from '~/types/content'
import ChapterRenderer from '~/components/content/ChapterRenderer.vue'

const route = useRoute()
const store = useLearningStore()

const slug = computed(() => route.params.slug as string)

// Try to fetch JSON content first
const { data: jsonChapter, error: jsonError } = await useFetch<ChapterJSON>(
  `/api/chapters/${slug.value}`,
  {
    key: `chapter-json-${slug.value}`
  }
)

// Fallback to markdown content
const { data: chapter } = await useAsyncData(
  `chapter-${slug.value}`,
  () => queryContent('chapters', slug.value).findOne()
)

// Use JSON if available (no error and has data)
const hasJsonContent = computed(() => !jsonError.value && jsonChapter.value !== null)

// Generate TOC from JSON content
const jsonToc = computed(() => {
  if (!jsonChapter.value) return []
  return jsonChapter.value.sections
    .filter(s => s.level <= 3) // Only h2 and h3
    .map(section => ({
      id: section.anchor,
      title: section.title,
      level: section.level
    }))
})

// Get chapter metadata
const currentChapter = computed(() => CHAPTERS.find(c => c.slug === slug.value))
const currentIndex = computed(() => CHAPTERS.findIndex(c => c.slug === slug.value))
const prevChapter = computed(() => currentIndex.value > 0 ? CHAPTERS[currentIndex.value - 1] : null)
const nextChapter = computed(() => currentIndex.value < CHAPTERS.length - 1 ? CHAPTERS[currentIndex.value + 1] : null)

// Toggle completion
const toggleComplete = () => {
  if (store.isChapterCompleted(slug.value)) {
    store.markChapterIncomplete(slug.value)
  } else {
    store.markChapterComplete(slug.value)
  }
}

// Track visit
onMounted(() => {
  store.updateLastVisited(slug.value)
})

// SEO
useHead({
  title: `${currentChapter.value?.title || 'Chapter'} - Docker 학습`
})
</script>
