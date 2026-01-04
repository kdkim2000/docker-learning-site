<script setup lang="ts">
import type { NetworkNodeType } from '~/types/content'

interface Props {
  id: string
  x: number
  y: number
  width?: number
  height?: number
  label: string
  sublabel?: string
  type?: NetworkNodeType | 'process' | 'component' | 'layer'
}

const props = withDefaults(defineProps<Props>(), {
  width: 120,
  height: 60,
  type: 'container'
})

const emit = defineEmits<{
  click: [id: string]
  hover: [id: string, isHovering: boolean]
}>()

const isHovered = ref(false)

const nodeClass = computed(() => {
  const baseClasses: Record<string, string> = {
    container: 'fill-docker-blue/20 stroke-docker-blue',
    bridge: 'fill-blue-500/20 stroke-blue-500',
    host: 'fill-green-500/20 stroke-green-500',
    veth: 'fill-purple-500/20 stroke-purple-500',
    interface: 'fill-orange-500/20 stroke-orange-500',
    firewall: 'fill-red-500/20 stroke-red-500',
    internet: 'fill-gray-500/20 stroke-gray-500',
    proxy: 'fill-yellow-500/20 stroke-yellow-500',
    server: 'fill-indigo-500/20 stroke-indigo-500',
    client: 'fill-teal-500/20 stroke-teal-500',
    process: 'fill-emerald-500/20 stroke-emerald-500',
    component: 'fill-sky-500/20 stroke-sky-500',
    layer: 'fill-violet-500/20 stroke-violet-500'
  }
  return baseClasses[props.type] || baseClasses.container
})

const iconPath = computed(() => {
  const icons: Record<string, string> = {
    container: 'M4 6h16M4 10h16M4 14h16M4 18h16',
    bridge: 'M3 12h4m10 0h4M7 12a5 5 0 0110 0',
    host: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m6 10V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
    server: 'M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01',
    proxy: 'M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z'
  }
  return icons[props.type] || icons.container
})

function handleClick() {
  emit('click', props.id)
}

function handleMouseEnter() {
  isHovered.value = true
  emit('hover', props.id, true)
}

function handleMouseLeave() {
  isHovered.value = false
  emit('hover', props.id, false)
}
</script>

<template>
  <g
    :transform="`translate(${x}, ${y})`"
    class="diagram-node cursor-pointer transition-all"
    :class="{ 'scale-105': isHovered }"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- Node background -->
    <rect
      :width="width"
      :height="height"
      rx="8"
      ry="8"
      :class="nodeClass"
      stroke-width="2"
      class="transition-all"
      :style="{ filter: isHovered ? 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' : 'none' }"
    />

    <!-- Icon (small, top-left) -->
    <g :transform="`translate(8, 8)`">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path
          :d="iconPath"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="text-gray-600 dark:text-gray-400"
        />
      </svg>
    </g>

    <!-- Label -->
    <text
      :x="width / 2"
      :y="height / 2 - (sublabel ? 4 : 0)"
      text-anchor="middle"
      dominant-baseline="middle"
      class="text-sm font-medium fill-gray-800 dark:fill-gray-200"
    >
      {{ label }}
    </text>

    <!-- Sublabel -->
    <text
      v-if="sublabel"
      :x="width / 2"
      :y="height / 2 + 12"
      text-anchor="middle"
      dominant-baseline="middle"
      class="text-xs fill-gray-500 dark:fill-gray-400"
    >
      {{ sublabel }}
    </text>
  </g>
</template>

<style scoped>
.diagram-node {
  transform-origin: center;
}
</style>
