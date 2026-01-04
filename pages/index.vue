<template>
  <div class="max-w-4xl mx-auto px-4 py-8 lg:py-12">
    <!-- Hero Section -->
    <div class="text-center mb-12">
      <div class="inline-flex items-center justify-center w-16 h-16 bg-docker-blue rounded-2xl mb-6">
        <svg class="w-10 h-10 text-white" viewBox="0 0 24 24" fill="currentColor">
          <path d="M13.983 11.078h2.119a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.119a.186.186 0 00-.185.186v1.887c0 .102.083.185.185.185zm-2.954-5.43h2.118a.186.186 0 00.186-.186V3.574a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 00.186-.186V6.29a.186.186 0 00-.186-.185h-2.118a.186.186 0 00-.185.185v1.887c0 .102.082.186.185.186zm-2.93 0h2.12a.186.186 0 00.184-.186V6.29a.186.186 0 00-.185-.185H8.1a.186.186 0 00-.185.185v1.887c0 .102.083.186.185.186zm-2.964 0h2.119a.186.186 0 00.185-.186V6.29a.186.186 0 00-.185-.185H5.136a.186.186 0 00-.186.185v1.887c0 .102.084.186.186.186zm5.893 2.715h2.118a.186.186 0 00.186-.185V9.006a.186.186 0 00-.186-.186h-2.118a.186.186 0 00-.185.186v1.887c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.185.185 0 00-.184.186v1.887c0 .102.083.185.185.185zm-2.964 0h2.119a.185.185 0 00.185-.185V9.006a.185.185 0 00-.185-.186h-2.119a.185.185 0 00-.185.186v1.887c0 .102.083.185.185.185zm-2.92 0h2.12a.185.185 0 00.184-.185V9.006a.185.185 0 00-.184-.186h-2.12a.186.186 0 00-.185.186v1.887c0 .102.084.185.185.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 00-.75.748 11.376 11.376 0 00.692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 003.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"/>
        </svg>
      </div>
      <h1 class="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Docker 컨테이너 빌드업
      </h1>
      <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
        컨테이너 가상화의 기초부터 CI/CD 자동화까지, Docker의 모든 것을 학습하세요.
      </p>
    </div>

    <!-- Progress Overview -->
    <div class="bg-gradient-to-r from-docker-blue to-blue-600 rounded-2xl p-6 mb-10 text-white">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 class="text-xl font-bold mb-1">학습 진도</h2>
          <p class="text-blue-100">
            {{ store.completedChapters }}개 챕터 완료 / 총 {{ store.totalChapters }}개
          </p>
        </div>
        <div class="text-4xl font-bold">
          {{ store.progressPercentage }}%
        </div>
      </div>
      <div class="mt-4 h-3 bg-white/20 rounded-full overflow-hidden">
        <div
          class="h-full bg-white rounded-full transition-all duration-500"
          :style="{ width: `${store.progressPercentage}%` }"
        />
      </div>
    </div>

    <!-- Curriculum Phases -->
    <div class="space-y-8">
      <!-- Phase 1 -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-medium rounded-full">
            Phase 1
          </span>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Docker Build-up</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">Docker의 기초 개념과 핵심 구성요소를 학습합니다.</p>
        <div class="grid gap-3">
          <ChapterCard
            v-for="chapter in phase1Chapters"
            :key="chapter.slug"
            :chapter="chapter"
            :completed="store.isChapterCompleted(chapter.slug)"
          />
        </div>
      </section>

      <!-- Phase 2 -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-full">
            Phase 2
          </span>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Docker Hands-on</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">실습 중심으로 Docker 활용 능력을 키웁니다.</p>
        <div class="grid gap-3">
          <ChapterCard
            v-for="chapter in phase2Chapters"
            :key="chapter.slug"
            :chapter="chapter"
            :completed="store.isChapterCompleted(chapter.slug)"
          />
        </div>
      </section>

      <!-- Phase 3 -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <span class="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-full">
            Phase 3
          </span>
          <h2 class="text-xl font-bold text-gray-900 dark:text-white">Docker Mastery</h2>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">오케스트레이션과 CI/CD를 마스터합니다.</p>
        <div class="grid gap-3">
          <ChapterCard
            v-for="chapter in phase3Chapters"
            :key="chapter.slug"
            :chapter="chapter"
            :completed="store.isChapterCompleted(chapter.slug)"
          />
        </div>
      </section>
    </div>

    <!-- External Resources -->
    <section class="mt-12 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
      <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-4">실습 환경</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <a
          v-for="link in externalLinks"
          :key="link.url"
          :href="link.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-docker-blue dark:hover:border-docker-blue transition-colors"
        >
          <div class="w-10 h-10 bg-docker-light dark:bg-docker-blue/20 rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 text-docker-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
          <div>
            <h3 class="font-medium text-gray-900 dark:text-white">{{ link.title }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ link.description }}</p>
          </div>
        </a>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useLearningStore } from '~/stores/learning'
import { CHAPTERS } from '~/types'

const store = useLearningStore()

// Phase groupings
const phase1Chapters = CHAPTERS.filter(c => c.number >= 0 && c.number <= 5)
const phase2Chapters = CHAPTERS.filter(c => c.number >= 6 && c.number <= 10)
const phase3Chapters = CHAPTERS.filter(c => c.number >= 11 && c.number <= 14)

const externalLinks = [
  {
    title: 'Play with Docker',
    description: '4시간 무료 Docker 샌드박스',
    url: 'https://labs.play-with-docker.com/'
  },
  {
    title: 'Docker Hub',
    description: '컨테이너 이미지 레지스트리',
    url: 'https://hub.docker.com/'
  },
  {
    title: 'Docker Documentation',
    description: '공식 Docker 문서',
    url: 'https://docs.docker.com/'
  },
  {
    title: 'Awesome Compose',
    description: 'Docker Compose 예제 모음',
    url: 'https://github.com/docker/awesome-compose'
  }
]
</script>
