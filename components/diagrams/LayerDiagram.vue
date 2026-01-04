<script setup lang="ts">
import type { LayerDiagramData, LayerStack, Layer } from '~/types/content'
import SvgContainer from './shared/SvgContainer.vue'

interface Props {
  data: LayerDiagramData
}

const props = defineProps<Props>()

const emit = defineEmits<{
  layerClick: [layer: Layer, stackId: string]
}>()

// Layout configuration
const config = {
  stackWidth: 200,
  stackGap: 40,
  layerHeight: 40,
  layerGap: 4,
  padding: 30,
  titleHeight: 30
}

const dimensions = computed(() => {
  const stacks = props.data.stacks
  const isHorizontal = props.data.orientation === 'horizontal'

  if (isHorizontal) {
    const maxLayers = Math.max(...stacks.map(s => s.layers.length))
    return {
      width: stacks.length * (config.stackWidth + config.stackGap) + config.padding * 2,
      height: maxLayers * (config.layerHeight + config.layerGap) + config.titleHeight + config.padding * 2
    }
  }

  return {
    width: config.stackWidth + config.padding * 2,
    height: stacks.reduce((h, s) => h + s.layers.length * (config.layerHeight + config.layerGap) + config.titleHeight + 20, 0) + config.padding
  }
})

const viewBox = computed(() => {
  return `0 0 ${dimensions.value.width} ${dimensions.value.height}`
})

function getStackPosition(index: number) {
  const isHorizontal = props.data.orientation === 'horizontal'

  if (isHorizontal) {
    return {
      x: config.padding + index * (config.stackWidth + config.stackGap),
      y: config.padding
    }
  }

  let y = config.padding
  for (let i = 0; i < index; i++) {
    const stack = props.data.stacks[i]
    y += stack.layers.length * (config.layerHeight + config.layerGap) + config.titleHeight + 20
  }

  return { x: config.padding, y }
}

function getLayerColor(layer: Layer, index: number, total: number) {
  if (layer.highlight) {
    return 'fill-docker-blue/30 stroke-docker-blue'
  }

  // Gradient based on position (darker at bottom)
  const intensity = Math.floor(200 + (55 * index / total))
  return `fill-gray-${Math.min(300, intensity)}/30 stroke-gray-${Math.min(400, intensity + 100)}`
}

function handleLayerClick(layer: Layer, stackId: string) {
  emit('layerClick', layer, stackId)
}
</script>

<template>
  <SvgContainer
    :width="dimensions.width"
    :height="dimensions.height"
    :view-box="viewBox"
  >
    <g
      v-for="(stack, stackIndex) in data.stacks"
      :key="stack.id"
      :transform="`translate(${getStackPosition(stackIndex).x}, ${getStackPosition(stackIndex).y})`"
    >
      <!-- Stack title -->
      <text
        :x="config.stackWidth / 2"
        y="0"
        text-anchor="middle"
        dominant-baseline="hanging"
        class="text-sm font-semibold fill-gray-700 dark:fill-gray-300"
      >
        {{ stack.title }}
      </text>

      <!-- Subtitle -->
      <text
        v-if="stack.subtitle"
        :x="config.stackWidth / 2"
        y="18"
        text-anchor="middle"
        dominant-baseline="hanging"
        class="text-xs fill-gray-500 dark:fill-gray-400"
      >
        {{ stack.subtitle }}
      </text>

      <!-- Layers (bottom to top) -->
      <g :transform="`translate(0, ${config.titleHeight})`">
        <g
          v-for="(layer, layerIndex) in [...stack.layers].reverse()"
          :key="layer.id"
          :transform="`translate(0, ${layerIndex * (config.layerHeight + config.layerGap)})`"
          class="cursor-pointer transition-all hover:opacity-80"
          @click="handleLayerClick(layer, stack.id)"
        >
          <!-- Layer background -->
          <rect
            x="0"
            y="0"
            :width="config.stackWidth"
            :height="config.layerHeight"
            rx="4"
            ry="4"
            :class="layer.highlight
              ? 'fill-docker-blue/30 stroke-docker-blue'
              : 'fill-gray-100 stroke-gray-300 dark:fill-gray-700 dark:stroke-gray-600'"
            stroke-width="1.5"
          />

          <!-- Layer label -->
          <text
            :x="config.stackWidth / 2"
            :y="config.layerHeight / 2"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-xs font-medium"
            :class="layer.highlight
              ? 'fill-docker-blue-dark dark:fill-docker-blue'
              : 'fill-gray-700 dark:fill-gray-300'"
          >
            {{ layer.label }}
          </text>

          <!-- Sublabel -->
          <text
            v-if="layer.sublabel"
            :x="config.stackWidth / 2"
            :y="config.layerHeight / 2 + 12"
            text-anchor="middle"
            dominant-baseline="middle"
            class="text-xs fill-gray-500 dark:fill-gray-400"
          >
            {{ layer.sublabel }}
          </text>
        </g>
      </g>
    </g>

    <!-- Comparison arrow (if comparing stacks) -->
    <g v-if="data.showComparison && data.stacks.length > 1">
      <text
        :x="dimensions.width / 2"
        :y="dimensions.height / 2"
        text-anchor="middle"
        dominant-baseline="middle"
        class="text-2xl fill-gray-400 dark:fill-gray-500"
      >
        vs
      </text>
    </g>
  </SvgContainer>
</template>
