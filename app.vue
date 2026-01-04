<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
// Initialize dark mode at app level
// This runs on both server and client, but useDark handles SSR gracefully
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: '',
  storageKey: 'docker-learning-dark-mode'
})
</script>
