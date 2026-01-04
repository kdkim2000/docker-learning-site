<template>
  <nav class="space-y-1">
    <template v-for="link in links" :key="link.id">
      <a
        :href="`#${link.id}`"
        :class="[
          'toc-link',
          link.depth === 3 && 'ml-4 text-xs',
          activeId === link.id && 'active'
        ]"
        @click="handleClick(link.id)"
      >
        {{ link.text }}
      </a>

      <!-- Nested links -->
      <template v-if="link.children?.length">
        <a
          v-for="child in link.children"
          :key="child.id"
          :href="`#${child.id}`"
          :class="[
            'toc-link ml-4 text-xs',
            activeId === child.id && 'active'
          ]"
          @click="handleClick(child.id)"
        >
          {{ child.text }}
        </a>
      </template>
    </template>

    <!-- Bookmark button -->
    <div v-if="activeId" class="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
      <button
        @click="toggleBookmark"
        :class="[
          'flex items-center gap-2 text-sm w-full px-3 py-2 rounded-lg transition-colors',
          isBookmarked
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
        ]"
      >
        <svg class="w-4 h-4" :fill="isBookmarked ? 'currentColor' : 'none'" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {{ isBookmarked ? '북마크됨' : '북마크 추가' }}
      </button>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { useLearningStore } from '~/stores/learning'
import type { TocLink } from '~/types'

const props = defineProps<{
  links: TocLink[]
}>()

const route = useRoute()
const store = useLearningStore()

const activeId = ref('')

// Get current chapter slug
const chapterId = computed(() => route.params.slug as string)

// Check if current section is bookmarked
const isBookmarked = computed(() =>
  store.isBookmarked(chapterId.value, activeId.value)
)

// Toggle bookmark
const toggleBookmark = () => {
  if (isBookmarked.value) {
    store.removeBookmarkBySection(chapterId.value, activeId.value)
  } else {
    const heading = document.getElementById(activeId.value)
    if (heading) {
      store.addBookmark({
        chapterId: chapterId.value,
        sectionId: activeId.value,
        title: heading.textContent || '',
        excerpt: heading.nextElementSibling?.textContent?.slice(0, 100) || ''
      })
    }
  }
}

// Handle click
const handleClick = (id: string) => {
  activeId.value = id
}

// Scroll spy
onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      })
    },
    {
      rootMargin: '-100px 0px -66%'
    }
  )

  // Get all heading IDs from links
  const getAllIds = (links: TocLink[]): string[] => {
    const ids: string[] = []
    links.forEach((link) => {
      ids.push(link.id)
      if (link.children) {
        ids.push(...getAllIds(link.children))
      }
    })
    return ids
  }

  const ids = getAllIds(props.links)

  ids.forEach((id) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })

  onUnmounted(() => observer.disconnect())
})
</script>
