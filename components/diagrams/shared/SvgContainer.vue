<script setup lang="ts">
interface Props {
  width?: number
  height?: number
  viewBox?: string
  preserveAspectRatio?: string
}

const props = withDefaults(defineProps<Props>(), {
  width: 800,
  height: 400,
  viewBox: '0 0 800 400',
  preserveAspectRatio: 'xMidYMid meet'
})

const containerRef = ref<HTMLDivElement>()
</script>

<template>
  <div
    ref="containerRef"
    class="svg-container relative w-full overflow-x-auto"
  >
    <svg
      :width="props.width"
      :height="props.height"
      :viewBox="props.viewBox"
      :preserveAspectRatio="props.preserveAspectRatio"
      class="diagram-svg min-w-full"
    >
      <defs>
        <!-- Arrow markers -->
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            class="fill-gray-600 dark:fill-gray-400"
          />
        </marker>
        <marker
          id="arrowhead-reverse"
          markerWidth="10"
          markerHeight="7"
          refX="1"
          refY="3.5"
          orient="auto"
        >
          <polygon
            points="10 0, 0 3.5, 10 7"
            class="fill-gray-600 dark:fill-gray-400"
          />
        </marker>

        <!-- Gradient definitions -->
        <linearGradient id="containerGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" class="stop-docker-blue/80" style="stop-color: rgb(13, 183, 237)" />
          <stop offset="100%" class="stop-docker-blue" style="stop-color: rgb(0, 145, 200)" />
        </linearGradient>

        <linearGradient id="bridgeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color: rgb(59, 130, 246)" />
          <stop offset="100%" style="stop-color: rgb(37, 99, 235)" />
        </linearGradient>
      </defs>

      <slot />
    </svg>
  </div>
</template>

<style scoped>
.svg-container {
  @apply rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-4;
}

.diagram-svg {
  display: block;
}
</style>
