import { useCallback, useEffect, useRef, useState } from 'react'
import { accountsEnabled, loadCloud, saveCloud, watchUser, type AccountUser } from '../lib/account'
import { EMPTY_PROFILE, type Profile } from '../lib/profile'
import { readJSON, writeJSON } from '../lib/storage'
import type { Saved, WishItem } from './useSaved'

const KEY = 'scene:profile'

export type SyncState = 'local' | 'syncing' | 'synced' | 'error'

/**
 * The person's profile, saved on this device. When accounts are on and they
 * sign in, it also follows them to other devices, with their favorites and
 * wish list.
 */
export function useProfile(saved: Saved) {
  const [profile, setProfile] = useState<Profile>(() => ({ ...EMPTY_PROFILE, ...readJSON<Partial<Profile>>(KEY, {}) }))
  const [user, setUser] = useState<AccountUser | null>(null)
  const [sync, setSync] = useState<SyncState>('local')
  const pulled = useRef<string | null>(null)

  useEffect(() => writeJSON(KEY, profile), [profile])
  useEffect(() => watchUser(setUser), [])

  const update = useCallback((patch: Partial<Profile>) => setProfile((p) => ({ ...p, ...patch })), [])
  const reset = useCallback(() => setProfile({ ...EMPTY_PROFILE, onboarded: true }), [])

  // On sign-in: bring in what's saved in the account, then keep it up to date.
  const { mergeIn, favorites, wishlist } = saved
  useEffect(() => {
    if (!user) { pulled.current = null; return }
    if (pulled.current === user.id) return
    pulled.current = user.id
    setSync('syncing')
    loadCloud(user.id).then(
      (cloud) => {
        if (cloud) {
          setProfile((p) => ({ ...EMPTY_PROFILE, ...(cloud.profile as Partial<Profile>), name: (cloud.profile as Profile)?.name || p.name || user.name || '', onboarded: true }))
          mergeIn(cloud.favorites ?? [], (cloud.wishlist ?? []) as WishItem[])
        } else if (user.name) {
          setProfile((p) => (p.name ? p : { ...p, name: user.name! }))
        }
        setSync('synced')
      },
      () => setSync('error'),
    )
  }, [user, mergeIn])

  useEffect(() => {
    if (!user || pulled.current !== user.id) return
    const t = window.setTimeout(() => {
      setSync('syncing')
      saveCloud(user.id, { profile, favorites, wishlist }).then(() => setSync('synced'), () => setSync('error'))
    }, 800)
    return () => window.clearTimeout(t)
  }, [user, profile, favorites, wishlist])

  return { profile, update, reset, user, sync: user ? sync : ('local' as SyncState), accountsEnabled }
}

export type ProfileApi = ReturnType<typeof useProfile>
