import { useCallback, useEffect, useState } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

export interface WishItem {
  id: string
  text: string
  /** Set when the item came from an event. */
  eventId?: string
  done: boolean
}

const FAV_KEY = 'scene:favorites'
const WISH_KEY = 'scene:wishlist'

function newId() {
  return `w-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/** Favorites (hearted events) and the wish list, remembered in this browser. */
export function useSaved() {
  const [favorites, setFavorites] = useState<string[]>(() => readJSON<string[]>(FAV_KEY, []))
  const [wishlist, setWishlist] = useState<WishItem[]>(() => readJSON<WishItem[]>(WISH_KEY, []))

  useEffect(() => writeJSON(FAV_KEY, favorites), [favorites])
  useEffect(() => writeJSON(WISH_KEY, wishlist), [wishlist])

  const isFavorite = useCallback((id: string) => favorites.includes(id), [favorites])
  const toggleFavorite = useCallback(
    (id: string) => setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [id, ...f])),
    [],
  )

  const onWishlist = useCallback((eventId: string) => wishlist.some((w) => w.eventId === eventId), [wishlist])
  const toggleWishEvent = useCallback((eventId: string, title: string) => {
    setWishlist((w) =>
      w.some((x) => x.eventId === eventId)
        ? w.filter((x) => x.eventId !== eventId)
        : [{ id: newId(), text: title, eventId, done: false }, ...w],
    )
  }, [])
  const addWish = useCallback((text: string) => {
    const t = text.trim()
    if (t) setWishlist((w) => [{ id: newId(), text: t, done: false }, ...w])
  }, [])
  const toggleWishDone = useCallback(
    (id: string) => setWishlist((w) => w.map((x) => (x.id === id ? { ...x, done: !x.done } : x))),
    [],
  )
  const removeWish = useCallback((id: string) => setWishlist((w) => w.filter((x) => x.id !== id)), [])

  return { favorites, isFavorite, toggleFavorite, wishlist, onWishlist, toggleWishEvent, addWish, toggleWishDone, removeWish }
}

export type Saved = ReturnType<typeof useSaved>
