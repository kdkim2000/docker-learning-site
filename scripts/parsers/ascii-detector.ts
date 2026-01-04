/**
 * ASCII Diagram Detection and Classification
 * Detects ASCII diagrams in code blocks and classifies their type
 */

import type { DiagramType } from '../../types/content'

// Detection patterns for ASCII diagrams
export const DIAGRAM_PATTERNS = {
  // Box drawing characters: ┌ ┐ └ ┘ ├ ┤ ┬ ┴ ┼ │ ─
  boxDrawing: /[┌┐└┘├┤┬┴┼│─╭╮╰╯]/,

  // Arrow patterns: → ← ↓ ↑ ↔ ──→ ←── ▼ ▲
  arrows: /[→←↓↑↔▼▲]|──→|←──|\-\->/,

  // Network topology indicators
  networkKeywords: /container|bridge|veth|eth\d|subnet|gateway|docker\d|proxy|nginx|haproxy|172\.\d+\.\d+\.\d+/i,

  // Flow/process indicators
  flowKeywords: /step|flow|process|build|push|pull|run|deploy|start|end|pipeline|stage/i,

  // Layer/stack indicators
  layerKeywords: /layer|stack|tier|vm|hypervisor|host\s?os|base\s?image|application/i,

  // Tree/hierarchy indicators
  treePatterns: /├──|└──|│\s+├|│\s+└|Stack|Service|Task/,

  // Architecture indicators
  architectureKeywords: /client|server|daemon|engine|api|rest|sandbox|endpoint|network|cnm|cni/i,
}

/**
 * Check if a code block content is an ASCII diagram
 */
export function isAsciiDiagram(content: string): boolean {
  const hasBoxDrawing = DIAGRAM_PATTERNS.boxDrawing.test(content)
  const hasArrows = DIAGRAM_PATTERNS.arrows.test(content)

  // Must have box drawing characters or arrows to be considered a diagram
  if (!hasBoxDrawing && !hasArrows) {
    return false
  }

  // Check line count (diagrams typically have multiple lines)
  const lines = content.split('\n').filter(l => l.trim())
  if (lines.length < 3) {
    return false
  }

  // Check if it has visual structure (not just random characters)
  const hasStructure = content.includes('│') || content.includes('─') ||
                       content.includes('┌') || content.includes('└')

  return hasStructure || hasArrows
}

/**
 * Detect the type of ASCII diagram based on its content
 */
export function detectDiagramType(content: string): DiagramType {
  const lowerContent = content.toLowerCase()

  // Check for tree patterns first (most specific)
  if (DIAGRAM_PATTERNS.treePatterns.test(content)) {
    // Check if it's a service/task/stack hierarchy
    if (/service|task|stack|replica/i.test(content)) {
      return 'tree'
    }
    // Directory structure is also tree
    if (/\.(yaml|yml|json|md|ts|js)/.test(content)) {
      return 'tree'
    }
    return 'tree'
  }

  // Check for layer diagrams (stacks, comparisons)
  if (DIAGRAM_PATTERNS.layerKeywords.test(content)) {
    // Multiple horizontal boxes stacked
    const boxCount = (content.match(/┌─+┐/g) || []).length
    if (boxCount >= 2) {
      return 'layer'
    }
    // Vertical stacking with ├── separators
    if (/├─+┤/.test(content) && boxCount >= 1) {
      return 'layer'
    }
  }

  // Check for network diagrams
  if (DIAGRAM_PATTERNS.networkKeywords.test(content)) {
    return 'network'
  }

  // Check for flow diagrams
  if (DIAGRAM_PATTERNS.flowKeywords.test(content)) {
    // Has directional flow
    if (/→|──→|↓|▼/.test(content)) {
      return 'flow'
    }
  }

  // Check for architecture diagrams (CNM, Docker components)
  if (DIAGRAM_PATTERNS.architectureKeywords.test(content)) {
    return 'architecture'
  }

  // Default: if has boxes and connections, it's architecture
  if (DIAGRAM_PATTERNS.boxDrawing.test(content) && DIAGRAM_PATTERNS.arrows.test(content)) {
    return 'architecture'
  }

  // Fallback to architecture for generic box diagrams
  return 'architecture'
}

/**
 * Extract metadata from ASCII diagram content
 */
export function extractDiagramMetadata(content: string): {
  title?: string
  nodeCount: number
  hasConnections: boolean
  orientation: 'vertical' | 'horizontal'
} {
  const lines = content.split('\n')

  // Count box-like structures
  const nodeCount = (content.match(/┌─+[^┐]*┐/g) || []).length

  // Check for connections (arrows or lines between boxes)
  const hasConnections = /[→←↓↑↔]|──|│/.test(content)

  // Determine orientation based on arrow directions
  const hasVerticalFlow = /↓|↑|▼|▲/.test(content)
  const hasHorizontalFlow = /→|←|──→|←──/.test(content)

  let orientation: 'vertical' | 'horizontal' = 'vertical'
  if (hasHorizontalFlow && !hasVerticalFlow) {
    orientation = 'horizontal'
  }

  // Try to extract title (first non-empty, non-box line)
  let title: string | undefined
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !DIAGRAM_PATTERNS.boxDrawing.test(trimmed)) {
      if (trimmed.length < 50 && !trimmed.includes('│')) {
        title = trimmed
        break
      }
    }
  }

  return {
    title,
    nodeCount,
    hasConnections,
    orientation
  }
}

/**
 * Parse box boundaries from ASCII content
 */
export interface ParsedBox {
  top: number
  left: number
  bottom: number
  right: number
  content: string[]
  label: string
  sublabel?: string
}

export function findBoxes(lines: string[]): ParsedBox[] {
  const boxes: ParsedBox[] = []

  for (let row = 0; row < lines.length; row++) {
    const line = lines[row]
    let col = 0

    while (col < line.length) {
      // Look for box start (┌)
      const startCol = line.indexOf('┌', col)
      if (startCol === -1) break

      // Find box end on same line (┐)
      const endCol = line.indexOf('┐', startCol)
      if (endCol === -1) {
        col = startCol + 1
        continue
      }

      // Find box bottom (└...┘)
      let bottomRow = row + 1
      while (bottomRow < lines.length) {
        if (lines[bottomRow].charAt(startCol) === '└') {
          break
        }
        bottomRow++
      }

      if (bottomRow < lines.length) {
        // Extract content within box
        const content: string[] = []
        for (let r = row + 1; r < bottomRow; r++) {
          const contentLine = lines[r].substring(startCol + 1, endCol).trim()
          if (contentLine && contentLine !== '│') {
            content.push(contentLine.replace(/│/g, '').trim())
          }
        }

        // First line is label, rest is sublabel
        const label = content[0] || ''
        const sublabel = content.slice(1).join(' ').trim() || undefined

        boxes.push({
          top: row,
          left: startCol,
          bottom: bottomRow,
          right: endCol,
          content,
          label,
          sublabel
        })
      }

      col = endCol + 1
    }
  }

  return boxes
}

/**
 * Find connections between boxes
 */
export interface ParsedConnection {
  fromBox: number
  toBox: number
  type: 'solid' | 'dashed' | 'bidirectional'
}

export function findConnections(lines: string[], boxes: ParsedBox[]): ParsedConnection[] {
  const connections: ParsedConnection[] = []

  // Simple heuristic: boxes that are vertically or horizontally adjacent
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      const box1 = boxes[i]
      const box2 = boxes[j]

      // Check vertical connection
      if (box1.bottom < box2.top &&
          box1.left <= box2.right && box1.right >= box2.left) {
        // Check if there's a connecting line between them
        const midCol = Math.floor((box1.left + box1.right) / 2)
        let hasConnection = false

        for (let r = box1.bottom; r < box2.top; r++) {
          if (lines[r]?.charAt(midCol) === '│' || lines[r]?.includes('↓')) {
            hasConnection = true
            break
          }
        }

        if (hasConnection) {
          connections.push({
            fromBox: i,
            toBox: j,
            type: 'solid'
          })
        }
      }

      // Check horizontal connection
      if (box1.right < box2.left &&
          box1.top <= box2.bottom && box1.bottom >= box2.top) {
        const midRow = Math.floor((box1.top + box1.bottom) / 2)
        let hasConnection = false

        for (let c = box1.right; c < box2.left; c++) {
          if (lines[midRow]?.charAt(c) === '─' || lines[midRow]?.charAt(c) === '→') {
            hasConnection = true
            break
          }
        }

        if (hasConnection) {
          connections.push({
            fromBox: i,
            toBox: j,
            type: lines[midRow]?.includes('↔') ? 'bidirectional' : 'solid'
          })
        }
      }
    }
  }

  return connections
}
