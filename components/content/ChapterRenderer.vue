<script setup lang="ts">
import type { ChapterJSON } from '~/types/content'
import SectionRenderer from './SectionRenderer.vue'

interface Props {
  chapter: ChapterJSON
}

const props = defineProps<Props>()

// Generate table of contents from sections (exposed for parent component)
const toc = computed(() => {
  return props.chapter.sections
    .filter(s => s.level <= 3) // Only h2 and h3
    .map(section => ({
      id: section.anchor,
      title: section.title,
      level: section.level
    }))
})

// Expose toc for parent to use
defineExpose({ toc })
</script>

<template>
  <div class="chapter-renderer">
    <!-- Chapter header -->
    <header class="chapter-header mb-8">
      <div class="flex items-center gap-2 mb-2">
        <span class="px-2 py-1 text-xs font-medium rounded-full"
          :class="{
            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300': chapter.meta.phase === 'buildup',
            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300': chapter.meta.phase === 'practical',
            'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300': chapter.meta.phase === 'master'
          }"
        >
          {{ chapter.meta.phase === 'buildup' ? '기초' : chapter.meta.phase === 'practical' ? '실습' : '심화' }}
        </span>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          Chapter {{ chapter.meta.number }}
        </span>
      </div>

      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        {{ chapter.meta.title }}
      </h1>

      <p v-if="chapter.meta.description" class="text-lg text-gray-600 dark:text-gray-400">
        {{ chapter.meta.description }}
      </p>

      <!-- Objectives -->
      <div v-if="chapter.meta.objectives.length > 0" class="mt-6 p-4 bg-docker-blue/5 dark:bg-docker-blue/10 rounded-lg border border-docker-blue/20">
        <h3 class="text-sm font-medium text-docker-blue-dark dark:text-docker-blue mb-2">
          학습 목표
        </h3>
        <ul class="list-disc list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
          <li v-for="(objective, index) in chapter.meta.objectives" :key="index">
            {{ objective }}
          </li>
        </ul>
      </div>
    </header>

    <!-- Chapter content -->
    <div class="chapter-content">
      <SectionRenderer
        v-for="section in chapter.sections"
        :key="section.id"
        :section="section"
        :diagrams="chapter.diagrams"
        :tables="chapter.tables"
      />
    </div>
  </div>
</template>

<style scoped>
.chapter-renderer {
  @apply relative;
}

.chapter-content {
  @apply max-w-none prose prose-gray dark:prose-invert;
}

.chapter-content :deep(h2),
.chapter-content :deep(h3),
.chapter-content :deep(h4) {
  @apply scroll-mt-20;
}
</style>
