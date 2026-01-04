/**
 * ASCII to JSON Diagram Converter
 * Converts ASCII diagrams to structured JSON for Vue component rendering
 */

import type {
  DiagramDefinition,
  DiagramType,
  NetworkDiagramData,
  NetworkNode,
  NetworkNodeType,
  FlowDiagramData,
  FlowStep,
  LayerDiagramData,
  LayerStack,
  TreeDiagramData,
  TreeNode,
  ArchitectureDiagramData,
  Connection,
  Position
} from '../../types/content'

import {
  detectDiagramType,
  extractDiagramMetadata,
  findBoxes,
  findConnections,
  type ParsedBox
} from './ascii-detector'

import { generateMermaidCode } from './mermaid-generator'

let diagramCounter = 0

/**
 * Convert ASCII diagram to structured JSON
 */
export function convertAsciiToDiagram(ascii: string, chapterId: string): DiagramDefinition {
  const type = detectDiagramType(ascii)
  const metadata = extractDiagramMetadata(ascii)
  const id = `${chapterId}-diagram-${++diagramCounter}`

  let data: DiagramDefinition['data']

  switch (type) {
    case 'network':
      data = parseNetworkDiagram(ascii)
      break
    case 'flow':
      data = parseFlowDiagram(ascii)
      break
    case 'layer':
      data = parseLayerDiagram(ascii)
      break
    case 'tree':
      data = parseTreeDiagram(ascii)
      break
    case 'architecture':
    default:
      data = parseArchitectureDiagram(ascii)
      break
  }

  // Generate Mermaid code from ASCII
  const mermaidCode = generateMermaidCode(ascii, type)

  return {
    id,
    type,
    title: metadata.title,
    asciiOriginal: ascii,
    mermaidCode: mermaidCode || undefined,
    data
  }
}

/**
 * Reset diagram counter (call before processing each chapter)
 */
export function resetDiagramCounter(): void {
  diagramCounter = 0
}

/**
 * Parse network topology diagram
 */
function parseNetworkDiagram(ascii: string): NetworkDiagramData {
  const lines = ascii.split('\n')
  const boxes = findBoxes(lines)
  const parsedConnections = findConnections(lines, boxes)

  const nodes: NetworkNode[] = boxes.map((box, index) => ({
    id: `node-${index}`,
    type: inferNetworkNodeType(box.label, box.sublabel),
    label: cleanLabel(box.label),
    sublabel: box.sublabel,
    position: calculatePosition(box, boxes.length, index),
    size: { width: 120, height: 60 }
  }))

  const connections: Connection[] = parsedConnections.map(conn => ({
    from: `node-${conn.fromBox}`,
    to: `node-${conn.toBox}`,
    type: conn.type
  }))

  return { nodes, connections }
}

/**
 * Parse flow/process diagram
 */
function parseFlowDiagram(ascii: string): FlowDiagramData {
  const lines = ascii.split('\n')
  const boxes = findBoxes(lines)
  const metadata = extractDiagramMetadata(ascii)

  const steps: FlowStep[] = boxes.map((box, index) => ({
    id: `step-${index}`,
    label: cleanLabel(box.label),
    sublabel: box.sublabel,
    type: inferFlowStepType(box.label, index, boxes.length),
    position: calculatePosition(box, boxes.length, index),
    size: { width: 100, height: 50 }
  }))

  // Create sequential connections for flow
  const connections: FlowDiagramData['connections'] = []
  for (let i = 0; i < steps.length - 1; i++) {
    connections.push({
      from: steps[i].id,
      to: steps[i + 1].id,
      type: 'solid'
    })
  }

  return {
    steps,
    connections,
    orientation: metadata.orientation
  }
}

/**
 * Parse layer/stack diagram
 */
function parseLayerDiagram(ascii: string): LayerDiagramData {
  const lines = ascii.split('\n')

  // Try to identify multiple stacks (side by side comparison)
  const stacks: LayerStack[] = []

  // Look for horizontal separators that indicate stacks side by side
  const stackBoundaries = findStackBoundaries(lines)

  if (stackBoundaries.length > 1) {
    // Multiple stacks (comparison diagram)
    for (let i = 0; i < stackBoundaries.length; i++) {
      const { start, end, title } = stackBoundaries[i]
      const stackLines = lines.map(l => l.substring(start, end))
      const layers = extractLayers(stackLines)

      stacks.push({
        id: `stack-${i}`,
        title: title || `Stack ${i + 1}`,
        layers
      })
    }
  } else {
    // Single stack (vertical layers)
    const layers = extractLayers(lines)
    stacks.push({
      id: 'stack-0',
      title: 'Docker Image',
      layers
    })
  }

  return {
    stacks,
    orientation: stackBoundaries.length > 1 ? 'horizontal' : 'vertical'
  }
}

/**
 * Parse tree/hierarchy diagram
 */
function parseTreeDiagram(ascii: string): TreeDiagramData {
  const lines = ascii.split('\n')
  const root = buildTreeFromLines(lines)

  return {
    root,
    orientation: 'vertical'
  }
}

/**
 * Parse architecture diagram
 */
function parseArchitectureDiagram(ascii: string): ArchitectureDiagramData {
  const lines = ascii.split('\n')
  const boxes = findBoxes(lines)
  const parsedConnections = findConnections(lines, boxes)

  const components = boxes.map((box, index) => ({
    id: `component-${index}`,
    label: cleanLabel(box.label),
    sublabel: box.sublabel,
    type: 'component' as const,
    position: calculatePosition(box, boxes.length, index),
    size: { width: 140, height: 70 }
  }))

  const connections: Connection[] = parsedConnections.map(conn => ({
    from: `component-${conn.fromBox}`,
    to: `component-${conn.toBox}`,
    type: conn.type
  }))

  return { components, connections }
}

// -------------------- Helper Functions --------------------

function inferNetworkNodeType(label: string, sublabel?: string): NetworkNodeType {
  const text = `${label} ${sublabel || ''}`.toLowerCase()

  if (text.includes('container') || text.includes('컨테이너')) return 'container'
  if (text.includes('bridge') || text.includes('docker0')) return 'bridge'
  if (text.includes('veth')) return 'veth'
  if (text.includes('eth') || text.includes('interface')) return 'interface'
  if (text.includes('host') || text.includes('호스트')) return 'host'
  if (text.includes('proxy') || text.includes('nginx') || text.includes('haproxy')) return 'proxy'
  if (text.includes('server') || text.includes('서버')) return 'server'
  if (text.includes('client') || text.includes('클라이언트')) return 'client'
  if (text.includes('firewall') || text.includes('방화벽')) return 'firewall'
  if (text.includes('internet') || text.includes('인터넷')) return 'internet'

  return 'container'
}

function inferFlowStepType(
  label: string,
  index: number,
  total: number
): FlowStep['type'] {
  const text = label.toLowerCase()

  if (index === 0 || text.includes('start') || text.includes('시작')) return 'start'
  if (index === total - 1 || text.includes('end') || text.includes('완료')) return 'end'
  if (text.includes('?') || text.includes('decision') || text.includes('판단')) return 'decision'
  if (text.includes('sub') || text.includes('호출')) return 'subprocess'
  if (text.includes('input') || text.includes('output') || text.includes('입력')) return 'io'

  return 'process'
}

function calculatePosition(box: ParsedBox, totalBoxes: number, index: number): Position {
  // Calculate position based on ASCII box position
  // Scale from character positions to SVG coordinates
  const scaleX = 10  // 10px per character
  const scaleY = 20  // 20px per line

  return {
    x: box.left * scaleX + 50,
    y: box.top * scaleY + 50
  }
}

function cleanLabel(label: string): string {
  return label
    .replace(/[│─┌┐└┘├┤┬┴┼]/g, '')
    .replace(/^\s*[\-\|]+\s*/, '')
    .trim()
}

function findStackBoundaries(lines: string[]): { start: number; end: number; title?: string }[] {
  const boundaries: { start: number; end: number; title?: string }[] = []

  // Find vertical separators (|) or look for multiple boxes side by side
  const firstBoxLine = lines.find(l => l.includes('┌'))
  if (!firstBoxLine) return [{ start: 0, end: lines[0]?.length || 80 }]

  // Find all box starts on the same line
  let col = 0
  while (col < firstBoxLine.length) {
    const start = firstBoxLine.indexOf('┌', col)
    if (start === -1) break

    const end = firstBoxLine.indexOf('┐', start)
    if (end === -1) break

    boundaries.push({
      start,
      end: end + 1,
      title: undefined
    })

    col = end + 1
  }

  return boundaries.length > 0 ? boundaries : [{ start: 0, end: 80 }]
}

function extractLayers(lines: string[]): LayerDiagramData['stacks'][0]['layers'] {
  const layers: LayerDiagramData['stacks'][0]['layers'] = []
  let currentLayer: string[] = []

  for (const line of lines) {
    if (line.includes('├') || line.includes('─')) {
      // Layer separator
      if (currentLayer.length > 0) {
        const text = currentLayer.join(' ').replace(/[│├┤─]/g, '').trim()
        if (text) {
          layers.push({
            id: `layer-${layers.length}`,
            label: text,
            highlight: text.toLowerCase().includes('application') || text.toLowerCase().includes('웹')
          })
        }
        currentLayer = []
      }
    } else {
      const cleaned = line.replace(/[│┌┐└┘]/g, '').trim()
      if (cleaned) currentLayer.push(cleaned)
    }
  }

  // Don't forget the last layer
  if (currentLayer.length > 0) {
    const text = currentLayer.join(' ').replace(/[│├┤─]/g, '').trim()
    if (text) {
      layers.push({
        id: `layer-${layers.length}`,
        label: text
      })
    }
  }

  return layers
}

function buildTreeFromLines(lines: string[]): TreeNode {
  const root: TreeNode = {
    id: 'root',
    label: 'Root',
    type: 'root',
    children: []
  }

  const stack: { node: TreeNode; indent: number }[] = [{ node: root, indent: -1 }]

  for (const line of lines) {
    // Match tree structure patterns: ├── └── or simple indentation
    const match = line.match(/^(\s*)(├──|└──|│\s*)?(.+)$/)
    if (!match) continue

    const indent = match[1].length + (match[2]?.length || 0)
    const content = match[3].trim()

    if (!content || content === '│') continue

    // Clean up the content
    const cleanContent = content.replace(/^[├└│─\s]+/, '').trim()
    if (!cleanContent) continue

    // Check for target info (e.g., "→ Worker Node 1")
    const targetMatch = cleanContent.match(/(.+?)\s*→\s*(.+)/)

    const newNode: TreeNode = {
      id: `node-${stack.length}`,
      label: targetMatch ? targetMatch[1].trim() : cleanContent,
      type: 'branch',
      targetInfo: targetMatch ? targetMatch[2].trim() : undefined,
      children: []
    }

    // Find parent based on indentation
    while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
      stack.pop()
    }

    const parent = stack[stack.length - 1].node
    if (!parent.children) parent.children = []
    parent.children.push(newNode)

    stack.push({ node: newNode, indent })
  }

  // If root only has one child, use that as root
  if (root.children?.length === 1) {
    return root.children[0]
  }

  return root
}

/**
 * Batch convert multiple ASCII diagrams
 */
export function convertAllDiagrams(
  diagrams: { content: string; context?: string }[],
  chapterId: string
): DiagramDefinition[] {
  resetDiagramCounter()
  return diagrams.map(d => convertAsciiToDiagram(d.content, chapterId))
}
