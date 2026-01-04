<script setup lang="ts">
import type { DiagramDefinition, DiagramType } from '~/types/content'
import NetworkDiagram from './NetworkDiagram.vue'
import FlowDiagram from './FlowDiagram.vue'
import LayerDiagram from './LayerDiagram.vue'
import TreeDiagram from './TreeDiagram.vue'
import MermaidDiagram from './MermaidDiagram.vue'

interface Props {
  diagram: DiagramDefinition
  showAscii?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showAscii: false
})

const emit = defineEmits<{
  nodeClick: [node: any]
}>()

// Check if Mermaid code is available
const hasMermaid = computed(() => !!props.diagram.mermaidCode)

// Toggle between different view modes
const viewMode = ref<'mermaid' | 'svg' | 'ascii'>(hasMermaid.value ? 'mermaid' : 'svg')

// Available view modes based on diagram data
const availableModes = computed(() => {
  const modes: ('mermaid' | 'svg' | 'ascii')[] = []
  if (hasMermaid.value) modes.push('mermaid')
  if (hasValidData.value) modes.push('svg')
  modes.push('ascii') // ASCII is always available
  return modes
})

// Check if label contains box-drawing characters (indicates parsing failure)
function hasBoxDrawingChars(label: string): boolean {
  return /[┌┐└┘├┤┬┴┼│─╭╮╰╯]/.test(label)
}

// Validate tree node recursively
function isValidTreeNode(node: any): boolean {
  if (!node || !node.label) return false
  if (hasBoxDrawingChars(node.label)) return false
  if (node.children && node.children.length > 0) {
    return node.children.some((child: any) => isValidTreeNode(child))
  }
  return true
}

// Check if the diagram data is valid for SVG rendering
const hasValidData = computed(() => {
  const data = props.diagram.data
  if (!data) return false

  switch (props.diagram.type) {
    case 'network':
      return 'nodes' in data && Array.isArray(data.nodes) && data.nodes.length > 0
    case 'flow':
      return 'steps' in data && Array.isArray(data.steps) && data.steps.length > 0
    case 'layer':
      return 'stacks' in data && Array.isArray(data.stacks) && data.stacks.length > 0
    case 'tree':
      if (!('root' in data) || !data.root) return false
      return isValidTreeNode(data.root)
    case 'architecture':
      return 'components' in data && Array.isArray(data.components) && data.components.length > 0
    default:
      return false
  }
})

const diagramComponent = computed(() => {
  if (!hasValidData.value) return null

  const componentMap: Record<DiagramType, any> = {
    network: NetworkDiagram,
    flow: FlowDiagram,
    layer: LayerDiagram,
    tree: TreeDiagram,
    architecture: NetworkDiagram
  }

  return componentMap[props.diagram.type]
})

function handleNodeClick(node: any) {
  emit('nodeClick', node)
}

function cycleView() {
  const currentIndex = availableModes.value.indexOf(viewMode.value)
  const nextIndex = (currentIndex + 1) % availableModes.value.length
  viewMode.value = availableModes.value[nextIndex]
}

const viewLabel = computed(() => {
  switch (viewMode.value) {
    case 'mermaid': return 'Mermaid'
    case 'svg': return 'SVG'
    case 'ascii': return 'ASCII'
  }
})
</script>

<template>
  <div class="diagram-wrapper">
    <!-- Title -->
    <div v-if="diagram.title" class="diagram-title">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {{ diagram.title }}
      </h4>
    </div>

    <!-- View toggle -->
    <div v-if="availableModes.length > 1" class="view-toggle mb-2">
      <button
        class="text-xs px-3 py-1 rounded transition-colors bg-docker-blue text-white hover:bg-docker-dark"
        @click="cycleView"
      >
        {{ viewLabel }} ↻
      </button>
    </div>

    <!-- Mermaid Diagram -->
    <template v-if="viewMode === 'mermaid' && hasMermaid">
      <MermaidDiagram
        :code="diagram.mermaidCode!"
        :id="diagram.id"
      />
    </template>

    <!-- SVG Diagram -->
    <template v-else-if="viewMode === 'svg' && hasValidData && diagramComponent">
      <component
        :is="diagramComponent"
        :data="diagram.data"
        @node-click="handleNodeClick"
      />
    </template>

    <!-- ASCII Fallback -->
    <template v-else>
      <div class="ascii-diagram">
        <pre class="ascii-content">{{ diagram.asciiOriginal }}</pre>
      </div>
    </template>
  </div>
</template>

<style scoped>
.diagram-wrapper {
  @apply my-4;
}

.view-toggle {
  @apply flex justify-end;
}

.ascii-diagram {
  @apply rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 p-4 overflow-x-auto;
}

.ascii-content {
  @apply font-mono text-xs leading-tight text-gray-800 dark:text-gray-200 whitespace-pre;
}
</style>
