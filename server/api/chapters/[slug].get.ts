import { readFile } from 'fs/promises'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: 'Chapter slug is required'
    })
  }

  try {
    const jsonPath = join(process.cwd(), 'public', 'json', 'chapters', `${slug}.json`)
    const content = await readFile(jsonPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    throw createError({
      statusCode: 404,
      message: `Chapter ${slug} JSON not found`
    })
  }
})
