import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { ChapterProgress, Bookmark, ProgressStorage } from '~/types'

export const useLearningStore = defineStore('learning', () => {
  // Progress tracking with localStorage persistence
  const progress = useLocalStorage<ProgressStorage>('docker-learning-progress', {})

  // Bookmarks with localStorage persistence
  const bookmarks = useLocalStorage<Bookmark[]>('docker-learning-bookmarks', [])

  // Total chapters
  const totalChapters = 15

  // Computed: completed chapters count
  const completedChapters = computed(() =>
    Object.values(progress.value).filter((p) => p.completed).length
  )

  // Computed: progress percentage
  const progressPercentage = computed(() =>
    Math.round((completedChapters.value / totalChapters) * 100)
  )

  // Check if a chapter is completed
  function isChapterCompleted(chapterId: string): boolean {
    return progress.value[chapterId]?.completed ?? false
  }

  // Get chapter progress
  function getChapterProgress(chapterId: string): ChapterProgress | null {
    return progress.value[chapterId] ?? null
  }

  // Mark chapter as complete
  function markChapterComplete(chapterId: string) {
    progress.value[chapterId] = {
      ...progress.value[chapterId],
      chapterId,
      completed: true,
      completedAt: new Date().toISOString(),
      lastVisited: progress.value[chapterId]?.lastVisited ?? new Date().toISOString(),
      scrollPosition: progress.value[chapterId]?.scrollPosition ?? 0
    }
  }

  // Mark chapter as incomplete
  function markChapterIncomplete(chapterId: string) {
    if (progress.value[chapterId]) {
      progress.value[chapterId] = {
        ...progress.value[chapterId],
        completed: false,
        completedAt: null
      }
    }
  }

  // Update last visited
  function updateLastVisited(chapterId: string, scrollPosition = 0) {
    progress.value[chapterId] = {
      chapterId,
      completed: progress.value[chapterId]?.completed ?? false,
      completedAt: progress.value[chapterId]?.completedAt ?? null,
      lastVisited: new Date().toISOString(),
      scrollPosition
    }
  }

  // Add bookmark
  function addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>) {
    const existingIndex = bookmarks.value.findIndex(
      (b) => b.chapterId === bookmark.chapterId && b.sectionId === bookmark.sectionId
    )

    if (existingIndex === -1) {
      const newBookmark: Bookmark = {
        ...bookmark,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      }
      bookmarks.value.push(newBookmark)
    }
  }

  // Remove bookmark
  function removeBookmark(id: string) {
    const index = bookmarks.value.findIndex((b) => b.id === id)
    if (index !== -1) {
      bookmarks.value.splice(index, 1)
    }
  }

  // Remove bookmark by chapter and section
  function removeBookmarkBySection(chapterId: string, sectionId: string) {
    const index = bookmarks.value.findIndex(
      (b) => b.chapterId === chapterId && b.sectionId === sectionId
    )
    if (index !== -1) {
      bookmarks.value.splice(index, 1)
    }
  }

  // Check if section is bookmarked
  function isBookmarked(chapterId: string, sectionId: string): boolean {
    return bookmarks.value.some(
      (b) => b.chapterId === chapterId && b.sectionId === sectionId
    )
  }

  // Get bookmarks for a chapter
  function getChapterBookmarks(chapterId: string): Bookmark[] {
    return bookmarks.value.filter((b) => b.chapterId === chapterId)
  }

  // Reset all progress
  function resetProgress() {
    progress.value = {}
  }

  // Reset all bookmarks
  function resetBookmarks() {
    bookmarks.value = []
  }

  return {
    // State
    progress,
    bookmarks,
    totalChapters,

    // Computed
    completedChapters,
    progressPercentage,

    // Actions
    isChapterCompleted,
    getChapterProgress,
    markChapterComplete,
    markChapterIncomplete,
    updateLastVisited,
    addBookmark,
    removeBookmark,
    removeBookmarkBySection,
    isBookmarked,
    getChapterBookmarks,
    resetProgress,
    resetBookmarks
  }
})
