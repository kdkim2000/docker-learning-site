// Chapter metadata
export interface Chapter {
  slug: string
  number: number
  title: string
  description?: string
  _path: string
}

// Progress tracking
export interface ChapterProgress {
  chapterId: string
  completed: boolean
  completedAt: string | null
  lastVisited: string
  scrollPosition: number
}

export interface ProgressStorage {
  [chapterId: string]: ChapterProgress
}

// Bookmarks
export interface Bookmark {
  id: string
  chapterId: string
  sectionId: string
  title: string
  excerpt: string
  createdAt: string
}

// Search
export interface SearchResult {
  id: string
  chapterId: string
  title: string
  heading: string
  section: string
  score: number
  snippet?: string
}

export interface SearchDocument {
  id: string
  chapterId: string
  title: string
  heading: string
  content: string
  section: string
}

// Table of Contents
export interface TocLink {
  id: string
  text: string
  depth: number
  children?: TocLink[]
}

// Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  fontSize: 'small' | 'medium' | 'large'
  sidebarCollapsed: boolean
}

// Chapter list data
export const CHAPTERS: Chapter[] = [
  { slug: 'chapter00', number: 0, title: 'Docker 컨테이너 빌드업 - 전체 강의 개요', _path: '/chapters/chapter00' },
  { slug: 'chapter01', number: 1, title: '컨테이너 가상화 이해', _path: '/chapters/chapter01' },
  { slug: 'chapter02', number: 2, title: 'Docker 플랫폼 구성과 동작 원리', _path: '/chapters/chapter02' },
  { slug: 'chapter03', number: 3, title: 'Docker 엔진 관리와 업데이트', _path: '/chapters/chapter03' },
  { slug: 'chapter04', number: 4, title: 'Docker 이미지 관리', _path: '/chapters/chapter04' },
  { slug: 'chapter05', number: 5, title: '컨테이너 생명주기와 관리', _path: '/chapters/chapter05' },
  { slug: 'chapter06', number: 6, title: 'Docker 네트워크', _path: '/chapters/chapter06' },
  { slug: 'chapter07', number: 7, title: '컨테이너 자원관리', _path: '/chapters/chapter07' },
  { slug: 'chapter08', number: 8, title: 'Docker Volume', _path: '/chapters/chapter08' },
  { slug: 'chapter09', number: 9, title: 'Dockerfile', _path: '/chapters/chapter09' },
  { slug: 'chapter10', number: 10, title: 'Docker Compose', _path: '/chapters/chapter10' },
  { slug: 'chapter11', number: 11, title: 'Docker Swarm', _path: '/chapters/chapter11' },
  { slug: 'chapter12', number: 12, title: 'Docker CI (Continuous Integration)', _path: '/chapters/chapter12' },
  { slug: 'chapter13', number: 13, title: '클라우드 기반 Amazon ECS 서비스', _path: '/chapters/chapter13' },
  { slug: 'chapter14', number: 14, title: '컨테이너 배포 자동화 CI/CD 구성', _path: '/chapters/chapter14' }
]
