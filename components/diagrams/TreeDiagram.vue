<script setup lang="ts">
import type { TreeDiagramData, TreeNode } from '~/types/content'
import SvgContainer from './shared/SvgContainer.vue'

interface Props {
  data: TreeDiagramData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  nodeClick: [node: TreeNode]
}>()

// Layout configuration
const config = {
  nodeWidth: 140,
  nodeHeight: 36,
  horizontalGap: 20,
  verticalGap: 50,
  padding: 40
}

interface LayoutNode extends TreeNode {
  x: number
  y: number
  width: number
  height: number
}

// Calculate tree layout
const layoutTree = computed(() => {
  const nodes: LayoutNode[] = []
  const connections: { from: LayoutNode; to: LayoutNode }[] = []

  function calculateSubtreeWidth(node: TreeNode): number {
    if (!node.children || node.children.length === 0) {
      return config.nodeWidth
    }
    const childrenWidth = node.children.reduce(
      (sum, child) => sum + calculateSubtreeWidth(child) + config.horizontalGap,
      -config.horizontalGap
    )
    return Math.max(config.nodeWidth, childrenWidth)
  }

  function processNode(
    node: TreeNode,
    x: number,
    y: number,
    parent?: LayoutNode
  ): LayoutNode {
    const subtreeWidth = calculateSubtreeWidth(node)
    const nodeX = x + (subtreeWidth - config.nodeWidth) / 2

    const layoutNodeData: LayoutNode = {
      ...node,
      x: nodeX,
      y,
      width: config.nodeWidth,
      height: config.nodeHeight
    }

    nodes.push(layoutNodeData)

    if (parent) {
      connections.push({ from: parent, to: layoutNodeData })
    }

    if (node.children && node.children.length > 0) {
      let childX = x
      const childY = y + config.nodeHeight + config.verticalGap

      for (const child of node.children) {
        const childWidth = calculateSubtreeWidth(child)
        processNode(child, childX, childY, layoutNodeData)
        childX += childWidth + config.horizontalGap
      }
    }

    return layoutNodeData
  }

  processNode(props.data.root, config.padding, config.padding)

  return { nodes, connections }
})

const dimensions = computed(() => {
  const nodes = layoutTree.value.nodes
  if (nodes.length === 0) return { width: 400, height: 300 }

  let maxX = 0
  let maxY = 0

  for (const node of nodes) {
    if (node.x + node.width > maxX) maxX = node.x + node.width
    if (node.y + node.height > maxY) maxY = node.y + node.height
  }

  return {
    width: maxX + config.padding,
    height: maxY + config.padding
  }
})

const viewBox = computed(() => {
  return `0 0 ${dimensions.value.width} ${dimensions.value.height}`
})

function getNodeColor(node: LayoutNode) {
  switch (node.type) {
    case 'root':
      return 'fill-docker-blue/30 stroke-docker-blue'
    case 'branch':
      return 'fill-blue-500/20 stroke-blue-500'
    case 'leaf':
      return 'fill-green-500/20 stroke-green-500'
    default:
      return 'fill-gray-100 stroke-gray-400 dark:fill-gray-700 dark:stroke-gray-500'
  }
}

function handleNodeClick(node: LayoutNode) {
  emit('nodeClick', node)
}
</script>

<template>
  <SvgContainer
    :width="dimensions.width"
    :height="dimensions.height"
    :view-box="viewBox"
  >
    <!-- Connections -->
    <g class="connections">
      <g
        v-for="(conn, index) in layoutTree.connections"
        :key="`conn-${index}`"
      >
        <path
          :d="`
            M ${conn.from.x + conn.from.width / 2} ${conn.from.y + conn.from.height}
            L ${conn.from.x + conn.from.width / 2} ${conn.from.y + conn.from.height + config.verticalGap / 2}
            L ${conn.to.x + conn.to.width / 2} ${conn.to.y - config.verticalGap / 2}
            L ${conn.to.x + conn.to.width / 2} ${conn.to.y}
          `"
          fill="none"
          class="stroke-gray-400 dark:stroke-gray-500"
          stroke-width="2"
        />
      </g>
    </g>

    <!-- Nodes -->
    <g class="nodes">
      <g
        v-for="node in layoutTree.nodes"
        :key="node.id"
        :transform="`translate(${node.x}, ${node.y})`"
        class="cursor-pointer"
        @click="handleNodeClick(node)"
      >
        <rect
          :width="node.width"
          :height="node.height"
          rx="6"
          ry="6"
          :class="getNodeColor(node)"
          stroke-width="2"
          class="transition-all hover:opacity-80"
        />

        <!-- Icon -->
        <g v-if="node.icon" transform="translate(8, 8)">
          <text class="text-sm">{{ node.icon }}</text>
        </g>

        <!-- Label -->
        <text
          :x="node.width / 2"
          :y="node.height / 2 - (node.sublabel ? 4 : 0)"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-xs font-medium fill-gray-800 dark:fill-gray-200"
        >
          {{ node.label }}
        </text>

        <!-- Sublabel -->
        <text
          v-if="node.sublabel"
          :x="node.width / 2"
          :y="node.height / 2 + 10"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {{ node.sublabel }}
        </text>

        <!-- Target info (like "→ Worker Node 1") -->
        <text
          v-if="node.targetInfo"
          :x="node.width + 8"
          :y="node.height / 2"
          text-anchor="start"
          dominant-baseline="middle"
          class="text-xs fill-gray-500 dark:fill-gray-400"
        >
          → {{ node.targetInfo }}
        </text>
      </g>
    </g>
  </SvgContainer>
</template>
