<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4"
      >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50" @click="close" />

        <!-- Modal -->
        <div class="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden">
          <!-- Search input -->
          <div class="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
            <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              type="text"
              placeholder="챕터 검색... (예: docker compose, 네트워크)"
              class="flex-1 bg-transparent text-lg outline-none placeholder-gray-400"
              @input="handleSearch"
            />
            <kbd class="hidden sm:block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">ESC</kbd>
          </div>

          <!-- Results -->
          <div class="max-h-96 overflow-y-auto">
            <!-- Loading -->
            <div v-if="isSearching" class="p-8 text-center text-gray-500">
              <svg class="w-6 h-6 mx-auto animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>

            <!-- No results -->
            <div v-else-if="query && results.length === 0" class="p-8 text-center text-gray-500">
              <p>"{{ query }}"에 대한 검색 결과가 없습니다.</p>
              <p class="text-sm mt-2">다른 키워드로 검색해 보세요.</p>
            </div>

            <!-- Results list -->
            <ul v-else-if="results.length > 0" class="divide-y divide-gray-100 dark:divide-gray-800">
              <li
                v-for="(result, index) in results"
                :key="result.id"
                :class="[
                  'p-4 cursor-pointer transition-colors',
                  selectedIndex === index
                    ? 'bg-docker-light dark:bg-docker-blue/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                ]"
                @click="navigateToResult(result)"
                @mouseenter="selectedIndex = index"
              >
                <div class="flex items-start gap-3">
                  <span class="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-sm font-medium">
                    {{ getChapterNumber(result.chapterId) }}
                  </span>
                  <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {{ result.heading }}
                    </h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {{ result.title }}
                    </p>
                  </div>
                </div>
              </li>
            </ul>

            <!-- Empty state -->
            <div v-else class="p-8 text-center text-gray-500">
              <p class="text-sm">검색어를 입력하세요</p>
              <div class="mt-4 flex flex-wrap justify-center gap-2">
                <button
                  v-for="suggestion in suggestions"
                  :key="suggestion"
                  @click="query = suggestion; handleSearch()"
                  class="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {{ suggestion }}
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-4">
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded shadow-sm">↑</kbd>
                <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded shadow-sm">↓</kbd>
                이동
              </span>
              <span class="flex items-center gap-1">
                <kbd class="px-1.5 py-0.5 bg-white dark:bg-gray-700 rounded shadow-sm">Enter</kbd>
                선택
              </span>
            </div>
            <span>{{ results.length }}개 결과</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import MiniSearch from 'minisearch'
import { CHAPTERS } from '~/types'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const inputRef = ref<HTMLInputElement>()
const query = ref('')
const results = ref<any[]>([])
const isSearching = ref(false)
const selectedIndex = ref(0)

const suggestions = ['Docker Compose', '네트워크', 'Dockerfile', '볼륨', 'Swarm']

// Initialize search index
let searchIndex: MiniSearch | null = null

const initSearchIndex = async () => {
  if (searchIndex) return

  const chapters = await queryContent('chapters').find()

  searchIndex = new MiniSearch({
    fields: ['title', 'heading', 'content'],
    storeFields: ['chapterId', 'title', 'heading', 'section'],
    searchOptions: {
      boost: { title: 3, heading: 2, content: 1 },
      fuzzy: 0.2,
      prefix: true
    }
  })

  const documents: any[] = []

  chapters.forEach((chapter: any) => {
    const slug = chapter._path?.split('/').pop() || ''

    // Index title
    documents.push({
      id: `${slug}-title`,
      chapterId: slug,
      title: chapter.title || '',
      heading: chapter.title || '',
      content: chapter.description || '',
      section: 'title'
    })

    // Index body text (simplified)
    if (chapter.body?.children) {
      let sectionId = 'intro'
      let sectionContent = ''

      const processNode = (node: any) => {
        if (node.tag === 'h2' || node.tag === 'h3') {
          // Save previous section
          if (sectionContent) {
            documents.push({
              id: `${slug}-${sectionId}`,
              chapterId: slug,
              title: chapter.title || '',
              heading: sectionId.replace(/-/g, ' '),
              content: sectionContent,
              section: sectionId
            })
          }
          // Start new section
          sectionId = node.props?.id || 'section'
          sectionContent = ''
        }

        if (node.type === 'text') {
          sectionContent += (node.value || '') + ' '
        }

        if (node.children) {
          node.children.forEach(processNode)
        }
      }

      chapter.body.children.forEach(processNode)

      // Save last section
      if (sectionContent) {
        documents.push({
          id: `${slug}-${sectionId}`,
          chapterId: slug,
          title: chapter.title || '',
          heading: sectionId.replace(/-/g, ' '),
          content: sectionContent,
          section: sectionId
        })
      }
    }
  })

  searchIndex.addAll(documents)
}

const handleSearch = async () => {
  if (!query.value.trim()) {
    results.value = []
    return
  }

  isSearching.value = true

  try {
    await initSearchIndex()

    if (searchIndex) {
      results.value = searchIndex.search(query.value, { limit: 15 })
      selectedIndex.value = 0
    }
  } finally {
    isSearching.value = false
  }
}

const navigateToResult = (result: any) => {
  const path = `/chapters/${result.chapterId}`
  const hash = result.section !== 'title' ? `#${result.section}` : ''
  router.push(path + hash)
  close()
}

const getChapterNumber = (chapterId: string): number => {
  const chapter = CHAPTERS.find(c => c.slug === chapterId)
  return chapter?.number ?? 0
}

const close = () => {
  emit('update:modelValue', false)
  query.value = ''
  results.value = []
}

// Keyboard navigation
const handleKeydown = (e: KeyboardEvent) => {
  if (!props.modelValue) return

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIndex.value = Math.min(selectedIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIndex.value = Math.max(selectedIndex.value - 1, 0)
  } else if (e.key === 'Enter' && results.value[selectedIndex.value]) {
    e.preventDefault()
    navigateToResult(results.value[selectedIndex.value])
  }
}

watch(() => props.modelValue, (value) => {
  if (value) {
    nextTick(() => inputRef.value?.focus())
    window.addEventListener('keydown', handleKeydown)
  } else {
    window.removeEventListener('keydown', handleKeydown)
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active > div:last-child,
.modal-leave-active > div:last-child {
  transition: transform 0.2s ease;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95);
}
</style>
