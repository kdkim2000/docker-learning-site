<script setup lang="ts">
import type { FlowDiagramData, FlowStep } from '~/types/content'
import SvgContainer from './shared/SvgContainer.vue'
import DiagramConnection from './shared/DiagramConnection.vue'

interface Props {
  data: FlowDiagramData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  stepClick: [step: FlowStep]
}>()

// Auto-layout steps if positions are not ideal
const layoutSteps = computed(() => {
  const steps = props.data.steps
  const isHorizontal = props.data.orientation === 'horizontal'

  return steps.map((step, index) => {
    const spacing = isHorizontal ? 150 : 100
    const offset = isHorizontal ? 50 : 50

    return {
      ...step,
      position: {
        x: isHorizontal ? offset + index * spacing : 150,
        y: isHorizontal ? 100 : offset + index * spacing
      },
      size: step.size || { width: 100, height: 50 }
    }
  })
})

const dimensions = computed(() => {
  const isHorizontal = props.data.orientation === 'horizontal'
  const stepCount = layoutSteps.value.length

  if (isHorizontal) {
    return {
      width: Math.max(400, stepCount * 150 + 100),
      height: 250
    }
  }
  return {
    width: 400,
    height: Math.max(300, stepCount * 100 + 100)
  }
})

const viewBox = computed(() => {
  return `0 0 ${dimensions.value.width} ${dimensions.value.height}`
})

function getStepShape(step: FlowStep) {
  const w = step.size?.width || 100
  const h = step.size?.height || 50

  switch (step.type) {
    case 'start':
    case 'end':
      // Rounded rectangle (capsule)
      return {
        type: 'rect',
        rx: h / 2,
        ry: h / 2
      }
    case 'decision':
      // Diamond
      return {
        type: 'diamond'
      }
    case 'subprocess':
      // Double border rectangle
      return {
        type: 'subprocess'
      }
    case 'io':
      // Parallelogram
      return {
        type: 'parallelogram'
      }
    default:
      return {
        type: 'rect',
        rx: 8,
        ry: 8
      }
  }
}

function getStepColor(step: FlowStep) {
  switch (step.type) {
    case 'start':
      return 'fill-green-500/20 stroke-green-500'
    case 'end':
      return 'fill-red-500/20 stroke-red-500'
    case 'decision':
      return 'fill-yellow-500/20 stroke-yellow-500'
    case 'subprocess':
      return 'fill-blue-500/20 stroke-blue-500'
    case 'io':
      return 'fill-purple-500/20 stroke-purple-500'
    default:
      return 'fill-docker-blue/20 stroke-docker-blue'
  }
}

function getConnectionPoints(fromIndex: number, toIndex: number) {
  const from = layoutSteps.value[fromIndex]
  const to = layoutSteps.value[toIndex]

  if (!from || !to) return null

  const isHorizontal = props.data.orientation === 'horizontal'

  if (isHorizontal) {
    return {
      fromX: from.position.x + from.size.width,
      fromY: from.position.y + from.size.height / 2,
      toX: to.position.x,
      toY: to.position.y + to.size.height / 2
    }
  }

  return {
    fromX: from.position.x + from.size.width / 2,
    fromY: from.position.y + from.size.height,
    toX: to.position.x + to.size.width / 2,
    toY: to.position.y
  }
}

function handleStepClick(step: FlowStep) {
  emit('stepClick', step)
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
      <template v-for="(_, index) in layoutSteps.slice(0, -1)" :key="`conn-${index}`">
        <DiagramConnection
          v-if="getConnectionPoints(index, index + 1)"
          v-bind="getConnectionPoints(index, index + 1)!"
          type="solid"
        />
      </template>
    </g>

    <!-- Steps -->
    <g class="steps">
      <g
        v-for="step in layoutSteps"
        :key="step.id"
        :transform="`translate(${step.position.x}, ${step.position.y})`"
        class="cursor-pointer"
        @click="handleStepClick(step)"
      >
        <!-- Regular rectangle -->
        <template v-if="getStepShape(step).type === 'rect'">
          <rect
            :width="step.size.width"
            :height="step.size.height"
            :rx="getStepShape(step).rx"
            :ry="getStepShape(step).ry"
            :class="getStepColor(step)"
            stroke-width="2"
          />
        </template>

        <!-- Diamond for decisions -->
        <template v-else-if="getStepShape(step).type === 'diamond'">
          <polygon
            :points="`
              ${step.size.width / 2},0
              ${step.size.width},${step.size.height / 2}
              ${step.size.width / 2},${step.size.height}
              0,${step.size.height / 2}
            `"
            :class="getStepColor(step)"
            stroke-width="2"
          />
        </template>

        <!-- Subprocess (double border) -->
        <template v-else-if="getStepShape(step).type === 'subprocess'">
          <rect
            :width="step.size.width"
            :height="step.size.height"
            rx="4"
            ry="4"
            :class="getStepColor(step)"
            stroke-width="2"
          />
          <line
            x1="8"
            y1="0"
            x2="8"
            :y2="step.size.height"
            class="stroke-blue-500"
            stroke-width="2"
          />
          <line
            :x1="step.size.width - 8"
            y1="0"
            :x2="step.size.width - 8"
            :y2="step.size.height"
            class="stroke-blue-500"
            stroke-width="2"
          />
        </template>

        <!-- Label -->
        <text
          :x="step.size.width / 2"
          :y="step.size.height / 2"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-sm font-medium fill-gray-800 dark:fill-gray-200"
        >
          {{ step.label }}
        </text>

        <!-- Sublabel -->
        <text
          v-if="step.sublabel"
          :x="step.size.width / 2"
          :y="step.size.height / 2 + 14"
          text-anchor="middle"
          dominant-baseline="middle"
          class="text-xs fill-gray-500 dark:fill-gray-400"
        >
          {{ step.sublabel }}
        </text>
      </g>
    </g>
  </SvgContainer>
</template>
