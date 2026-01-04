<script setup lang="ts">
import mermaid from 'mermaid'

interface Props {
  code: string
  id: string
}

const props = defineProps<Props>()

const containerRef = ref<HTMLElement | null>(null)
const svgContent = ref('')
const error = ref<string | null>(null)

// Initialize mermaid with theme settings
const isDark = useDark()

const initMermaid = () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: isDark.value ? 'dark' : 'default',
    securityLevel: 'loose',
    flowchart: {
      useMaxWidth: true,
      htmlLabels: true,
      curve: 'basis'
    },
    themeVariables: isDark.value ? {
      primaryColor: '#2496ED',
      primaryTextColor: '#fff',
      primaryBorderColor: '#1D63ED',
      lineColor: '#6b7280',
      secondaryColor: '#374151',
      tertiaryColor: '#1f2937',
      background: '#111827',
      mainBkg: '#1f2937',
      nodeBorder: '#4b5563',
      clusterBkg: '#374151',
      clusterBorder: '#4b5563',
      titleColor: '#f3f4f6',
      edgeLabelBackground: '#374151'
    } : {
      primaryColor: '#2496ED',
      primaryTextColor: '#fff',
      primaryBorderColor: '#1D63ED',
      lineColor: '#6b7280',
      secondaryColor: '#e5e7eb',
      tertiaryColor: '#f3f4f6',
      background: '#ffffff',
      mainBkg: '#f3f4f6',
      nodeBorder: '#d1d5db',
      clusterBkg: '#f9fafb',
      clusterBorder: '#e5e7eb',
      titleColor: '#111827',
      edgeLabelBackground: '#ffffff'
    }
  })
}

const renderDiagram = async () => {
  if (!props.code) return

  try {
    error.value = null
    initMermaid()

    const { svg } = await mermaid.render(`mermaid-${props.id}`, props.code)
    svgContent.value = svg
  } catch (e) {
    console.error('Mermaid render error:', e)
    error.value = e instanceof Error ? e.message : 'Failed to render diagram'
  }
}

// Watch for dark mode changes
watch(isDark, () => {
  renderDiagram()
})

// Watch for code changes
watch(() => props.code, () => {
  renderDiagram()
})

onMounted(() => {
  renderDiagram()
})
</script>

<template>
  <div ref="containerRef" class="mermaid-diagram">
    <div v-if="error" class="error-message">
      <span class="error-icon">⚠️</span>
      <span>다이어그램 렌더링 실패: {{ error }}</span>
    </div>
    <div
      v-else-if="svgContent"
      class="svg-container"
      v-html="svgContent"
    />
    <div v-else class="loading">
      <span>로딩 중...</span>
    </div>
  </div>
</template>

<style scoped>
.mermaid-diagram {
  @apply my-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 overflow-x-auto;
}

.svg-container {
  @apply flex justify-center;
}

.svg-container :deep(svg) {
  @apply max-w-full h-auto;
}

.error-message {
  @apply flex items-center gap-2 text-red-600 dark:text-red-400 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded;
}

.loading {
  @apply flex items-center justify-center py-8 text-gray-500 dark:text-gray-400;
}
</style>
