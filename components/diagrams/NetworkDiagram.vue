<script setup lang="ts">
import type { NetworkDiagramData, NetworkNode, Connection } from '~/types/content'
import SvgContainer from './shared/SvgContainer.vue'
import DiagramNode from './shared/DiagramNode.vue'
import DiagramConnection from './shared/DiagramConnection.vue'

interface Props {
  data: NetworkDiagramData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  nodeClick: [node: NetworkNode]
}>()

// Calculate SVG dimensions based on node positions
const dimensions = computed(() => {
  const nodes = props.data.nodes
  if (nodes.length === 0) return { width: 400, height: 300 }

  let maxX = 0
  let maxY = 0

  for (const node of nodes) {
    const nodeRight = node.position.x + (node.size?.width || 120)
    const nodeBottom = node.position.y + (node.size?.height || 60)
    if (nodeRight > maxX) maxX = nodeRight
    if (nodeBottom > maxY) maxY = nodeBottom
  }

  return {
    width: Math.max(400, maxX + 50),
    height: Math.max(300, maxY + 50)
  }
})

const viewBox = computed(() => {
  return `0 0 ${dimensions.value.width} ${dimensions.value.height}`
})

// Map node IDs to positions for connections
const nodePositions = computed(() => {
  const positions: Record<string, { x: number; y: number; width: number; height: number }> = {}
  for (const node of props.data.nodes) {
    positions[node.id] = {
      x: node.position.x,
      y: node.position.y,
      width: node.size?.width || 120,
      height: node.size?.height || 60
    }
  }
  return positions
})

function getConnectionPoints(connection: Connection) {
  const from = nodePositions.value[connection.from]
  const to = nodePositions.value[connection.to]

  if (!from || !to) return null

  // Calculate center points
  const fromCenterX = from.x + from.width / 2
  const fromCenterY = from.y + from.height / 2
  const toCenterX = to.x + to.width / 2
  const toCenterY = to.y + to.height / 2

  // Determine connection points on node edges
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY

  let fromX = fromCenterX
  let fromY = fromCenterY
  let toX = toCenterX
  let toY = toCenterY

  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection
    if (dy > 0) {
      fromY = from.y + from.height
      toY = to.y
    } else {
      fromY = from.y
      toY = to.y + to.height
    }
  } else {
    // Horizontal connection
    if (dx > 0) {
      fromX = from.x + from.width
      toX = to.x
    } else {
      fromX = from.x
      toX = to.x + to.width
    }
  }

  return { fromX, fromY, toX, toY }
}

function handleNodeClick(nodeId: string) {
  const node = props.data.nodes.find(n => n.id === nodeId)
  if (node) {
    emit('nodeClick', node)
  }
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
      <template v-for="connection in data.connections" :key="`${connection.from}-${connection.to}`">
        <DiagramConnection
          v-if="getConnectionPoints(connection)"
          v-bind="getConnectionPoints(connection)!"
          :type="connection.type"
          :label="connection.label"
        />
      </template>
    </g>

    <!-- Nodes -->
    <g class="nodes">
      <DiagramNode
        v-for="node in data.nodes"
        :key="node.id"
        :id="node.id"
        :x="node.position.x"
        :y="node.position.y"
        :width="node.size?.width || 120"
        :height="node.size?.height || 60"
        :label="node.label"
        :sublabel="node.sublabel"
        :type="node.type"
        @click="handleNodeClick"
      />
    </g>
  </SvgContainer>
</template>
