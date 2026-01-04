<template>
  <div class="code-block-wrapper not-prose my-4">
    <div class="flex items-center justify-between px-4 py-2 bg-gray-800 rounded-t-lg border-b border-gray-700">
      <span class="text-xs text-gray-400 font-mono">{{ language || 'code' }}</span>
      <button
        @click="copyCode"
        :class="[
          'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
          copied
            ? 'bg-green-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
        ]"
      >
        <svg v-if="copied" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <svg v-else class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {{ copied ? '복사됨' : '복사' }}
      </button>
    </div>
    <pre
      :class="[
        'overflow-x-auto rounded-b-lg p-4 text-sm leading-relaxed',
        isAsciiDiagram ? 'ascii-diagram bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200' : 'bg-gray-900 text-gray-100'
      ]"
    ><code ref="codeRef" :class="codeClass"><slot /></code></pre>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  code?: string
  language?: string
  filename?: string
  highlights?: number[]
  meta?: string
}>()

const codeRef = ref<HTMLElement>()
const copied = ref(false)

// Check if this is ASCII diagram (text or no language)
const isAsciiDiagram = computed(() =>
  !props.language || props.language === 'text' || props.language === 'plaintext'
)

// Code class
const codeClass = computed(() => {
  if (isAsciiDiagram.value) {
    return 'font-mono whitespace-pre'
  }
  return props.language ? `language-${props.language}` : ''
})

// Copy code to clipboard
const copyCode = async () => {
  if (!codeRef.value) return

  const text = codeRef.value.textContent || ''

  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}
</script>
