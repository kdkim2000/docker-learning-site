<script setup lang="ts">
interface Props {
  fromX: number
  fromY: number
  toX: number
  toY: number
  type?: 'solid' | 'dashed' | 'bidirectional' | 'dotted'
  label?: string
  animated?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  type: 'solid',
  animated: false
})

const pathD = computed(() => {
  const dx = props.toX - props.fromX
  const dy = props.toY - props.fromY

  // Determine if vertical or horizontal
  if (Math.abs(dy) > Math.abs(dx)) {
    // Vertical connection with curve
    const midY = props.fromY + dy / 2
    return `M ${props.fromX} ${props.fromY} C ${props.fromX} ${midY}, ${props.toX} ${midY}, ${props.toX} ${props.toY}`
  } else {
    // Horizontal connection with curve
    const midX = props.fromX + dx / 2
    return `M ${props.fromX} ${props.fromY} C ${midX} ${props.fromY}, ${midX} ${props.toY}, ${props.toX} ${props.toY}`
  }
})

const strokeDasharray = computed(() => {
  if (props.type === 'dashed') return '8 4'
  if (props.type === 'dotted') return '2 2'
  return 'none'
})

const markerEnd = computed(() => {
  if (props.type === 'bidirectional') return 'url(#arrowhead)'
  return 'url(#arrowhead)'
})

const markerStart = computed(() => {
  if (props.type === 'bidirectional') return 'url(#arrowhead-reverse)'
  return ''
})

const labelPosition = computed(() => {
  return {
    x: (props.fromX + props.toX) / 2,
    y: (props.fromY + props.toY) / 2 - 8
  }
})
</script>

<template>
  <g class="diagram-connection">
    <!-- Connection line -->
    <path
      :d="pathD"
      fill="none"
      class="stroke-gray-400 dark:stroke-gray-500"
      stroke-width="2"
      :stroke-dasharray="strokeDasharray"
      :marker-end="markerEnd"
      :marker-start="markerStart"
    >
      <animate
        v-if="animated"
        attributeName="stroke-dashoffset"
        from="0"
        to="-20"
        dur="1s"
        repeatCount="indefinite"
      />
    </path>

    <!-- Label -->
    <g v-if="label" :transform="`translate(${labelPosition.x}, ${labelPosition.y})`">
      <rect
        :x="-label.length * 3.5"
        y="-10"
        :width="label.length * 7"
        height="16"
        rx="4"
        class="fill-white dark:fill-gray-800"
      />
      <text
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-xs fill-gray-600 dark:fill-gray-400"
      >
        {{ label }}
      </text>
    </g>
  </g>
</template>

<style scoped>
.diagram-connection path {
  transition: stroke 0.2s;
}

.diagram-connection:hover path {
  stroke-width: 3;
}
</style>
