<template>
  <div :class="calloutClass">
    <span v-if="emoji" class="callout-icon">{{ emoji }}</span>
    <div class="callout-content prose prose-sm dark:prose-invert max-w-none">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
const slots = useSlots()

// Emoji patterns for callout types
const emojiPatterns = {
  warning: ['⚠️', '⚠'],
  danger: ['❗', '!', '❌', '🔥'],
  info: ['👉', '📌', '💡', '📝', 'ℹ️'],
  success: ['✅', '✔️', '✔', '⭕']
}

// Extract emoji from slot content
const emoji = computed(() => {
  const slotContent = slots.default?.()
  if (!slotContent?.length) return null

  // Try to extract text content from the first paragraph
  const firstNode = slotContent[0]
  let textContent = ''

  const extractText = (node: any): string => {
    if (typeof node === 'string') return node
    if (node.children) {
      if (typeof node.children === 'string') return node.children
      if (Array.isArray(node.children)) {
        return node.children.map(extractText).join('')
      }
    }
    return ''
  }

  textContent = extractText(firstNode)

  // Check for emoji at the start
  const firstChar = textContent.trim().charAt(0)
  const secondChar = textContent.trim().slice(0, 2)

  // Check all emoji patterns
  for (const [, emojis] of Object.entries(emojiPatterns)) {
    if (emojis.includes(firstChar) || emojis.includes(secondChar)) {
      return firstChar
    }
  }

  return null
})

// Determine callout type based on emoji
const calloutType = computed(() => {
  if (!emoji.value) return 'default'

  for (const [type, emojis] of Object.entries(emojiPatterns)) {
    if (emojis.includes(emoji.value)) {
      return type
    }
  }

  return 'default'
})

// Generate class based on callout type
const calloutClass = computed(() => {
  const base = 'callout my-4'

  switch (calloutType.value) {
    case 'warning':
      return `${base} callout-warning`
    case 'danger':
      return `${base} callout-danger`
    case 'info':
      return `${base} callout-info`
    case 'success':
      return `${base} callout-success`
    default:
      return `${base} bg-gray-50 dark:bg-gray-800 border-l-4 border-gray-300 dark:border-gray-600`
  }
})
</script>
