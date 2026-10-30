/**
 * Category photos for event cards.
 *
 * Drop images into src/assets/events/ named by category, e.g. music.webp,
 * music-2.webp, food.webp. Each card picks one of its category's photos;
 * categories without a photo keep the generated cover art.
 *
 * These are mood photos for the category, not pictures of the specific event.
 */
import type { Category } from '../types/event'

const files = import.meta.glob<string>('../assets/events/*.{jpg,jpeg,png,webp,avif}', {
  eager: true,
  import: 'default',
})

const byCategory = new Map<string, string[]>()
for (const [path, url] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
  const name = path.split('/').pop()!.replace(/\.[a-z]+$/i, '')
  const category = name.replace(/-\d+$/, '').toLowerCase()
  byCategory.set(category, [...(byCategory.get(category) ?? []), url])
}

/** A photo for this category, chosen by `seed` so each event keeps the same one. */
export function photoFor(category: Category, seed: number): string | null {
  const list = byCategory.get(category)
  return list?.length ? list[seed % list.length] : null
}
