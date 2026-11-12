import { useCallback, useEffect, useState } from 'react'
import { cleanPhone } from '../lib/share'
import { readJSON, writeJSON } from '../lib/storage'

export interface Friend {
  id: string
  name: string
  phone: string
}

const KEY = 'scene:friends'

/**
 * Friends you text plans to. Names and numbers stay on this device only;
 * they are never sent to an account or a server.
 */
export function useFriends() {
  const [friends, setFriends] = useState<Friend[]>(() => readJSON<Friend[]>(KEY, []))
  useEffect(() => writeJSON(KEY, friends), [friends])

  const add = useCallback((name: string, phone: string): Friend | null => {
    const p = cleanPhone(phone)
    if (!p) return null
    const f: Friend = { id: `f-${p}`, name: name.trim() || p, phone: p }
    setFriends((list) => (list.some((x) => x.phone === p) ? list : [...list, f]))
    return f
  }, [])
  const remove = useCallback((id: string) => setFriends((list) => list.filter((f) => f.id !== id)), [])

  return { friends, add, remove }
}
