/**
 * Markdown Parser using unified/remark
 * Parses markdown files and extracts structured content
 */

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
import type { Root, Content, Heading, Code, Table, Blockquote, List, Paragraph } from 'mdast'
import type {
  ChapterJSON,
  ChapterMeta,
  Section,
  ContentBlock,
  CodeBlock,
  CalloutBlock,
  TableDefinition,
  DiagramDefinition,
  ListBlock
} from '../../types/content'
import { isAsciiDiagram } from './ascii-detector'
import { convertAsciiToDiagram, resetDiagramCounter } from './diagram-converter'

/**
 * Parse a markdown file and convert to ChapterJSON
 */
export async function parseMarkdownFile(
  content: string,
  chapterId: string
): Promise<ChapterJSON> {
  resetDiagramCounter()
  // Reset local counters for new chapter
  blockCounter = 0
  diagramRefCounter = 0

  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)

  const ast = processor.parse(content) as Root

  // Extract metadata from the document
  const meta = extractMeta(ast, chapterId)

  // Extract sections
  const sections = extractSections(ast, chapterId)

  // Extract all diagrams
  const diagrams = extractDiagrams(ast, chapterId)

  // Extract all tables
  const tables = extractTables(ast, chapterId)

  return {
    meta,
    sections,
    diagrams,
    tables
  }
}

/**
 * Extract chapter metadata from AST
 */
function extractMeta(ast: Root, chapterId: string): ChapterMeta {
  let title = ''
  let description = ''
  const objectives: string[] = []

  // Find the first h1 as title
  visit(ast, 'heading', (node: Heading) => {
    if (node.depth === 1 && !title) {
      title = extractText(node)
    }
  })

  // Extract chapter number from ID
  const numberMatch = chapterId.match(/chapter(\d+)/)
  const number = numberMatch ? parseInt(numberMatch[1], 10) : 0

  // Determine phase based on chapter number
  let phase: ChapterMeta['phase'] = 'buildup'
  if (number >= 6 && number <= 10) {
    phase = 'practical'
  } else if (number >= 11) {
    phase = 'master'
  }

  // Try to find objectives section
  let inObjectives = false
  visit(ast, (node) => {
    if (node.type === 'heading') {
      const headingNode = node as Heading
      const text = extractText(headingNode).toLowerCase()
      inObjectives = text.includes('목표') || text.includes('objective')
    }
    if (inObjectives && node.type === 'listItem') {
      const text = extractText(node as any)
      if (text) objectives.push(text)
    }
  })

  return {
    id: chapterId,
    number,
    title,
    description,
    phase,
    objectives
  }
}

/**
 * Extract sections from AST
 */
function extractSections(ast: Root, chapterId: string): Section[] {
  const sections: Section[] = []
  let currentSection: Section | null = null
  let sectionCounter = 0

  for (const node of ast.children) {
    if (node.type === 'heading') {
      const heading = node as Heading

      // Skip h1 (title) - it's in meta
      if (heading.depth === 1) continue

      // Create new section for h2, h3, h4
      if (heading.depth >= 2 && heading.depth <= 4) {
        const title = extractText(heading)
        const anchor = generateAnchor(title)

        currentSection = {
          id: `${chapterId}-section-${++sectionCounter}`,
          level: heading.depth as 1 | 2 | 3 | 4,
          title,
          anchor,
          content: []
        }
        sections.push(currentSection)
      }
    } else if (currentSection) {
      // Add content to current section
      const block = nodeToContentBlock(node, chapterId)
      if (block) {
        currentSection.content.push(block)
      }
    }
  }

  return sections
}

/**
 * Convert AST node to ContentBlock
 */
let blockCounter = 0
let diagramRefCounter = 0

function nodeToContentBlock(node: Content, chapterId: string): ContentBlock | null {
  const id = `${chapterId}-block-${++blockCounter}`

  switch (node.type) {
    case 'paragraph':
      return {
        id,
        type: 'text',
        data: {
          markdown: extractMarkdown(node)
        }
      }

    case 'code':
      const code = node as Code
      // Check if it's an ASCII diagram
      if (isAsciiDiagram(code.value)) {
        // Use separate counter to match diagram definitions
        return {
          id,
          type: 'diagram',
          data: {
            diagramId: `${chapterId}-diagram-${++diagramRefCounter}`,
            caption: code.meta || undefined
          }
        }
      }
      return {
        id,
        type: 'code',
        data: {
          language: code.lang || 'text',
          code: code.value,
          filename: code.meta || undefined,
          copyable: true
        } as CodeBlock
      }

    case 'blockquote':
      return parseCallout(node as Blockquote, id)

    case 'list':
      return parseList(node as List, id)

    case 'table':
      return {
        id,
        type: 'table',
        data: {
          tableId: `${chapterId}-table-${blockCounter}`
        }
      }

    default:
      return null
  }
}

/**
 * Parse blockquote as callout
 */
function parseCallout(node: Blockquote, id: string): ContentBlock {
  const text = extractText(node)
  const firstChar = text.trim().charAt(0)

  let type: CalloutBlock['type'] = 'note'
  let emoji: string | undefined

  // Detect callout type from emoji
  if (['❗', '!'].includes(firstChar)) {
    type = 'danger'
    emoji = '❗'
  } else if (['⚠️', '⚠'].includes(firstChar)) {
    type = 'warning'
    emoji = '⚠️'
  } else if (['👉', '💡', '📌'].includes(firstChar)) {
    type = 'tip'
    emoji = firstChar
  } else if (['✅', '✔'].includes(firstChar)) {
    type = 'info'
    emoji = '✅'
  }

  return {
    id,
    type: 'callout',
    data: {
      type,
      emoji,
      content: text
    } as CalloutBlock
  }
}

/**
 * Parse list
 */
function parseList(node: List, id: string): ContentBlock {
  const items: ListBlock['items'] = []

  for (const item of node.children) {
    if (item.type === 'listItem') {
      const text = extractText(item)
      items.push({ text })
    }
  }

  return {
    id,
    type: 'list',
    data: {
      ordered: node.ordered || false,
      items
    } as ListBlock
  }
}

/**
 * Extract all diagrams from AST
 */
function extractDiagrams(ast: Root, chapterId: string): DiagramDefinition[] {
  const diagrams: DiagramDefinition[] = []

  visit(ast, 'code', (node: Code) => {
    if (isAsciiDiagram(node.value)) {
      const diagram = convertAsciiToDiagram(node.value, chapterId)
      diagrams.push(diagram)
    }
  })

  return diagrams
}

/**
 * Extract all tables from AST
 */
function extractTables(ast: Root, chapterId: string): TableDefinition[] {
  const tables: TableDefinition[] = []
  let tableCounter = 0

  visit(ast, 'table', (node: Table) => {
    const headers = node.children[0]?.children.map((cell, i) => ({
      key: `col${i}`,
      label: extractText(cell as any),
      align: node.align?.[i] || 'left'
    })) || []

    const rows = node.children.slice(1).map(row => {
      const rowData: { [key: string]: string } = {}
      row.children.forEach((cell, i) => {
        rowData[`col${i}`] = extractText(cell as any)
      })
      return rowData
    })

    tables.push({
      id: `${chapterId}-table-${++tableCounter}`,
      headers,
      rows
    })
  })

  return tables
}

/**
 * Extract plain text from node
 */
function extractText(node: any): string {
  if (!node) return ''

  if (node.type === 'text') {
    return node.value || ''
  }

  if (node.children) {
    return node.children.map((child: any) => extractText(child)).join('')
  }

  if (node.value) {
    return node.value
  }

  return ''
}

/**
 * Extract markdown from node (preserves formatting)
 */
function extractMarkdown(node: any): string {
  // For now, just extract text
  // In a full implementation, we'd reconstruct markdown
  return extractText(node)
}

/**
 * Generate URL-friendly anchor from title
 */
function generateAnchor(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s가-힣-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
}
