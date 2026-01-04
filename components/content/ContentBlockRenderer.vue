<script setup lang="ts">
import type {
  ContentBlock,
  TextBlock,
  CodeBlock,
  DiagramRef,
  TableRef,
  CalloutBlock,
  ListBlock,
  DiagramDefinition,
  TableDefinition
} from '~/types/content'
import DiagramRenderer from '../diagrams/DiagramRenderer.vue'

interface Props {
  block: ContentBlock
  diagrams?: DiagramDefinition[]
  tables?: TableDefinition[]
}

const props = defineProps<Props>()

// Find diagram by ID
const diagram = computed(() => {
  if (props.block.type !== 'diagram') return null
  const data = props.block.data as DiagramRef
  return props.diagrams?.find(d => d.id === data.diagramId)
})

// Find table by ID
const table = computed(() => {
  if (props.block.type !== 'table') return null
  const data = props.block.data as TableRef
  return props.tables?.find(t => t.id === data.tableId)
})

// Get callout icon based on type
function getCalloutIcon(type: CalloutBlock['type']): string {
  const icons: Record<string, string> = {
    info: 'ℹ️',
    warning: '⚠️',
    tip: '💡',
    danger: '❗',
    note: '📝'
  }
  return icons[type] || icons.note
}

function getCalloutClass(type: CalloutBlock['type']): string {
  const classes: Record<string, string> = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
    tip: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
    danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
    note: 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700'
  }
  return classes[type] || classes.note
}
</script>

<template>
  <div :id="block.id" class="content-block mb-4">
    <!-- Text Block -->
    <template v-if="block.type === 'text'">
      <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
        {{ (block.data as TextBlock).markdown }}
      </p>
    </template>

    <!-- Code Block -->
    <template v-else-if="block.type === 'code'">
      <div class="code-block-wrapper relative">
        <div v-if="(block.data as CodeBlock).filename" class="code-filename">
          {{ (block.data as CodeBlock).filename }}
        </div>
        <pre class="code-block"><code :class="`language-${(block.data as CodeBlock).language}`">{{ (block.data as CodeBlock).code }}</code></pre>
        <button
          v-if="(block.data as CodeBlock).copyable !== false"
          class="copy-btn"
          @click="navigator.clipboard.writeText((block.data as CodeBlock).code)"
        >
          복사
        </button>
      </div>
    </template>

    <!-- Diagram Block -->
    <template v-else-if="block.type === 'diagram' && diagram">
      <DiagramRenderer :diagram="diagram" />
    </template>

    <!-- Table Block -->
    <template v-else-if="block.type === 'table' && table">
      <div class="table-wrapper overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead class="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th
                v-for="header in table.headers"
                :key="header.key"
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                :style="{ textAlign: header.align || 'left' }"
              >
                {{ header.label }}
              </th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            <tr v-for="(row, index) in table.rows" :key="index">
              <td
                v-for="header in table.headers"
                :key="header.key"
                class="px-4 py-3 text-sm text-gray-700 dark:text-gray-300"
              >
                {{ row[header.key] }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <!-- Callout Block -->
    <template v-else-if="block.type === 'callout'">
      <div
        class="callout-block rounded-lg border-l-4 p-4"
        :class="getCalloutClass((block.data as CalloutBlock).type)"
      >
        <div class="flex items-start gap-3">
          <span class="text-lg">
            {{ (block.data as CalloutBlock).emoji || getCalloutIcon((block.data as CalloutBlock).type) }}
          </span>
          <div>
            <h5
              v-if="(block.data as CalloutBlock).title"
              class="font-medium text-gray-800 dark:text-gray-200 mb-1"
            >
              {{ (block.data as CalloutBlock).title }}
            </h5>
            <p class="text-sm text-gray-700 dark:text-gray-300">
              {{ (block.data as CalloutBlock).content }}
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- List Block -->
    <template v-else-if="block.type === 'list'">
      <component
        :is="(block.data as ListBlock).ordered ? 'ol' : 'ul'"
        class="list-block pl-5"
        :class="(block.data as ListBlock).ordered ? 'list-decimal' : 'list-disc'"
      >
        <li
          v-for="(item, index) in (block.data as ListBlock).items"
          :key="index"
          class="text-gray-700 dark:text-gray-300 mb-1"
        >
          {{ item.text }}
        </li>
      </component>
    </template>
  </div>
</template>

<style scoped>
.code-block-wrapper {
  @apply rounded-lg overflow-hidden bg-gray-900 dark:bg-gray-950;
}

.code-filename {
  @apply px-4 py-2 text-xs text-gray-400 bg-gray-800 border-b border-gray-700;
}

.code-block {
  @apply p-4 overflow-x-auto text-sm text-gray-100;
}

.copy-btn {
  @apply absolute top-2 right-2 px-2 py-1 text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 rounded transition-colors;
}

.table-wrapper {
  @apply rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden;
}
</style>
