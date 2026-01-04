// ========================================
// Docker Learning Site - Content Schema Types
// ========================================

// -------------------- Chapter Structure --------------------

export interface ChapterJSON {
  meta: ChapterMeta
  sections: Section[]
  diagrams: DiagramDefinition[]
  tables: TableDefinition[]
}

export interface ChapterMeta {
  id: string                    // "chapter06"
  number: number                // 6
  title: string                 // "Docker 네트워크"
  description?: string
  phase: 'buildup' | 'practical' | 'master'
  objectives: string[]
  prerequisites?: string[]      // ["chapter05"]
  clips?: ClipInfo[]
}

export interface ClipInfo {
  number: number
  title: string
  type: 'theory' | 'practice'
}

// -------------------- Section Structure --------------------

export interface Section {
  id: string                    // "docker-network-overview"
  level: 1 | 2 | 3 | 4
  title: string
  anchor: string                // URL-friendly anchor
  content: ContentBlock[]
}

export interface ContentBlock {
  id: string
  type: ContentBlockType
  data: TextBlock | CodeBlock | DiagramRef | TableRef | CalloutBlock | ChecklistBlock | ListBlock
}

export type ContentBlockType = 'text' | 'code' | 'diagram' | 'table' | 'callout' | 'checklist' | 'list'

export interface TextBlock {
  markdown: string              // Markdown text content
}

export interface CodeBlock {
  language: string              // "bash", "yaml", "dockerfile"
  code: string
  filename?: string
  highlights?: number[]         // Line numbers to highlight
  copyable: boolean
  output?: string               // Expected output
}

export interface DiagramRef {
  diagramId: string             // Reference to diagrams array
  caption?: string
}

export interface TableRef {
  tableId: string               // Reference to tables array
  caption?: string
}

export interface CalloutBlock {
  type: 'info' | 'warning' | 'tip' | 'danger' | 'note'
  emoji?: string                // Original emoji if present
  title?: string
  content: string               // Markdown content
}

export interface ChecklistBlock {
  items: ChecklistItem[]
}

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
}

export interface ListBlock {
  ordered: boolean
  items: ListItem[]
}

export interface ListItem {
  text: string
  children?: ListItem[]
}

// -------------------- Diagram Definitions --------------------

export type DiagramType = 'network' | 'flow' | 'layer' | 'tree' | 'architecture'

export interface DiagramDefinition {
  id: string
  type: DiagramType
  title?: string
  asciiOriginal: string         // Original ASCII for fallback
  mermaidCode?: string          // Mermaid syntax for rendering
  data: NetworkDiagramData | FlowDiagramData | LayerDiagramData | TreeDiagramData | ArchitectureDiagramData
}

// Network Diagram (Chapter 6, 11) - Containers, bridges, veth pairs
export interface NetworkDiagramData {
  nodes: NetworkNode[]
  connections: Connection[]
  layers?: NetworkLayer[]       // For multi-layer diagrams
}

export interface NetworkNode {
  id: string
  type: NetworkNodeType
  label: string
  sublabel?: string             // IP address, port info
  position: Position
  size?: Size
  style?: NodeStyle
}

export type NetworkNodeType = 'container' | 'bridge' | 'host' | 'veth' | 'interface' | 'firewall' | 'internet' | 'proxy' | 'server' | 'client'

export interface NetworkLayer {
  id: string
  label: string
  bounds: Bounds
  type?: 'container-area' | 'network-area' | 'host-area'
}

// Flow Diagram (Chapter 2, 9, 12) - docker run flow, CI/CD pipelines
export interface FlowDiagramData {
  steps: FlowStep[]
  connections: FlowConnection[]
  orientation: 'vertical' | 'horizontal'
}

export interface FlowStep {
  id: string
  label: string
  sublabel?: string
  type: 'start' | 'process' | 'decision' | 'end' | 'subprocess' | 'io'
  position: Position
  size?: Size
}

export interface FlowConnection {
  from: string
  to: string
  label?: string
  type?: 'solid' | 'dashed'
  condition?: string            // For decision branches
}

// Layer Diagram (Chapter 1, 4) - Docker image layers, stack comparison
export interface LayerDiagramData {
  stacks: LayerStack[]
  orientation: 'vertical' | 'horizontal'
  showComparison?: boolean
}

export interface LayerStack {
  id: string
  title: string
  subtitle?: string             // e.g., "(GB)", "(MB)"
  layers: Layer[]
}

export interface Layer {
  id: string
  label: string
  sublabel?: string
  highlight?: boolean
  color?: string
  height?: number               // Relative height for visualization
}

// Tree Diagram (Chapter 10, 11) - Service/Task/Stack hierarchy
export interface TreeDiagramData {
  root: TreeNode
  orientation: 'vertical' | 'horizontal'
  showConnections?: boolean
}

export interface TreeNode {
  id: string
  label: string
  sublabel?: string
  type?: 'root' | 'branch' | 'leaf'
  children?: TreeNode[]
  collapsed?: boolean
  icon?: string
  targetInfo?: string           // e.g., "→ Worker Node 1"
}

// Architecture Diagram (Chapter 6, 10, 11) - CNM model, Docker Compose
export interface ArchitectureDiagramData {
  components: ArchComponent[]
  regions?: ArchRegion[]
  connections: Connection[]
}

export interface ArchComponent {
  id: string
  label: string
  sublabel?: string
  type: 'service' | 'component' | 'database' | 'external' | 'api' | 'queue'
  position: Position
  size: Size
  children?: ArchComponent[]
  icon?: string
}

export interface ArchRegion {
  id: string
  label: string
  bounds: Bounds
  style?: RegionStyle
}

// -------------------- Shared Types --------------------

export interface Position {
  x: number
  y: number
}

export interface Size {
  width: number
  height: number
}

export interface Bounds {
  x: number
  y: number
  width: number
  height: number
}

export interface Connection {
  from: string
  to: string
  type: 'solid' | 'dashed' | 'bidirectional' | 'dotted'
  label?: string
  style?: ConnectionStyle
}

export interface NodeStyle {
  fill?: string
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface ConnectionStyle {
  stroke?: string
  strokeWidth?: number
  animated?: boolean
}

export interface RegionStyle {
  fill?: string
  stroke?: string
  opacity?: number
}

// -------------------- Table Definitions --------------------

export interface TableDefinition {
  id: string
  title?: string
  headers: TableHeader[]
  rows: TableRow[]
  sortable?: boolean
  searchable?: boolean
  striped?: boolean
}

export interface TableHeader {
  key: string
  label: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

export interface TableRow {
  [key: string]: string | number | boolean | null
}

// -------------------- Chapter List (re-export from index.ts) --------------------

export { CHAPTERS } from './index'
