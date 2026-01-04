#!/usr/bin/env npx tsx
/**
 * Markdown to JSON Converter
 * Converts all chapter markdown files to structured JSON
 *
 * Usage:
 *   npx tsx scripts/convert-markdown.ts              # Convert all chapters
 *   npx tsx scripts/convert-markdown.ts chapter06    # Convert specific chapter
 */

import * as fs from 'fs/promises'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { parseMarkdownFile } from './parsers/markdown-parser'
import type { ChapterJSON } from '../types/content'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const CHAPTERS_DIR = path.join(__dirname, '../content/chapters')
const OUTPUT_DIR = path.join(__dirname, '../public/json/chapters')

async function convertChapter(chapterSlug: string): Promise<void> {
  const inputPath = path.join(CHAPTERS_DIR, `${chapterSlug}.md`)
  const outputPath = path.join(OUTPUT_DIR, `${chapterSlug}.json`)

  console.log(`\n📄 Converting ${chapterSlug}...`)

  try {
    // Read markdown file
    const markdown = await fs.readFile(inputPath, 'utf-8')
    console.log(`   ✓ Read ${markdown.length} characters`)

    // Parse to JSON
    const json = await parseMarkdownFile(markdown, chapterSlug)
    console.log(`   ✓ Parsed ${json.sections.length} sections`)
    console.log(`   ✓ Found ${json.diagrams.length} diagrams`)
    console.log(`   ✓ Found ${json.tables.length} tables`)

    // Try to preserve existing objectives and description from existing JSON
    try {
      const existingJson = JSON.parse(await fs.readFile(outputPath, 'utf-8'))
      if (existingJson.meta?.objectives?.length > 0 && json.meta.objectives.length === 0) {
        json.meta.objectives = existingJson.meta.objectives
        console.log(`   ✓ Preserved ${json.meta.objectives.length} objectives from existing JSON`)
      }
      if (existingJson.meta?.description && !json.meta.description) {
        json.meta.description = existingJson.meta.description
      }
    } catch {
      // No existing JSON file, skip
    }

    // Write JSON file
    await fs.writeFile(outputPath, JSON.stringify(json, null, 2), 'utf-8')
    console.log(`   ✓ Saved to ${outputPath}`)

    // Print summary
    printChapterSummary(json)
  } catch (error) {
    console.error(`   ✗ Error: ${error}`)
    throw error
  }
}

function printChapterSummary(json: ChapterJSON): void {
  console.log('\n   Summary:')
  console.log(`   - Title: ${json.meta.title}`)
  console.log(`   - Phase: ${json.meta.phase}`)

  if (json.diagrams.length > 0) {
    const diagramTypes = json.diagrams.reduce((acc, d) => {
      acc[d.type] = (acc[d.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log(`   - Diagram types: ${JSON.stringify(diagramTypes)}`)
  }
}

async function convertAllChapters(): Promise<void> {
  console.log('🚀 Starting markdown to JSON conversion...\n')

  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true })

  // Get all chapter files
  const files = await fs.readdir(CHAPTERS_DIR)
  const chapters = files
    .filter(f => f.match(/^chapter\d+\.md$/))
    .map(f => f.replace('.md', ''))
    .sort()

  console.log(`Found ${chapters.length} chapters to convert`)

  let success = 0
  let failed = 0

  for (const chapter of chapters) {
    try {
      await convertChapter(chapter)
      success++
    } catch {
      failed++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Conversion complete: ${success} succeeded, ${failed} failed`)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)

  if (args.length > 0) {
    // Convert specific chapter
    const chapterSlug = args[0]
    await fs.mkdir(OUTPUT_DIR, { recursive: true })
    await convertChapter(chapterSlug)
  } else {
    // Convert all chapters
    await convertAllChapters()
  }
}

main().catch(console.error)
