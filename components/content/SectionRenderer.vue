<script setup lang="ts">
import type { Section, DiagramDefinition, TableDefinition } from '~/types/content'
import ContentBlockRenderer from './ContentBlockRenderer.vue'

interface Props {
  section: Section
  diagrams?: DiagramDefinition[]
  tables?: TableDefinition[]
}

const props = defineProps<Props>()

const headingTag = computed(() => {
  const tags: Record<number, string> = {
    1: 'h1',
    2: 'h2',
    3: 'h3',
    4: 'h4'
  }
  return tags[props.section.level] || 'h3'
})

const headingClass = computed(() => {
  const classes: Record<number, string> = {
    1: 'text-3xl font-bold mb-6',
    2: 'text-2xl font-bold mb-4 mt-8 pb-2 border-b border-gray-200 dark:border-gray-700',
    3: 'text-xl font-semibold mb-3 mt-6',
    4: 'text-lg font-medium mb-2 mt-4'
  }
  return classes[props.section.level] || classes[3]
})
</script>

<template>
  <section :id="section.anchor" class="section-wrapper scroll-mt-20">
    <!-- Section heading -->
    <component
      :is="headingTag"
      :class="headingClass"
      class="text-gray-900 dark:text-gray-100"
    >
      <a
        :href="`#${section.anchor}`"
        class="hover:text-docker-blue transition-colors group"
      >
        {{ section.title }}
        <span class="opacity-0 group-hover:opacity-50 ml-2">#</span>
      </a>
    </component>

    <!-- Section content -->
    <div class="section-content">
      <ContentBlockRenderer
        v-for="block in section.content"
        :key="block.id"
        :block="block"
        :diagrams="diagrams"
        :tables="tables"
      />
    </div>
  </section>
</template>

<style scoped>
.section-wrapper {
  @apply relative;
}
</style>
