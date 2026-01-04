<template>
  <div class="min-h-screen bg-white dark:bg-gray-900 transition-colors">
    <!-- Header -->
    <AppHeader @toggle-sidebar="sidebarOpen = !sidebarOpen" @open-search="searchOpen = true" />

    <div class="flex">
      <!-- Sidebar -->
      <AppSidebar :open="sidebarOpen" @close="sidebarOpen = false" />

      <!-- Main Content -->
      <main class="flex-1 min-w-0">
        <slot />
      </main>
    </div>

    <!-- Search Modal -->
    <SearchModal v-model="searchOpen" />
  </div>
</template>

<script setup lang="ts">
const sidebarOpen = ref(false)
const searchOpen = ref(false)

// Keyboard shortcut for search (Ctrl+K)
onMounted(() => {
  const handleKeydown = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      searchOpen.value = true
    }
    if (e.key === 'Escape') {
      searchOpen.value = false
      sidebarOpen.value = false
    }
  }
  window.addEventListener('keydown', handleKeydown)
  onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
})
</script>
