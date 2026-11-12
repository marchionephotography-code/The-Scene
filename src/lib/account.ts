/**
 * Accounts (optional). Sign-in uses Supabase: an emailed sign-in link or
 * Google, no passwords to remember. It switches on when the site has
 * VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY; without them everything still
 * works and is saved on this device only.
 *
 * The Supabase library is loaded only when accounts are configured, so the
 * app stays small for everyone else. Table setup: supabase/schema.sql.
 */
import type { SupabaseClient, User } from '@supabase/supabase-js'

const URL_ = import.meta.env.VITE_SUPABASE_URL as string | undefined
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const accountsEnabled = Boolean(URL_ && KEY)

export interface AccountUser {
  id: string
  email: string | null
  name: string | null
}

let client: Promise<SupabaseClient> | null = null
function supabase(): Promise<SupabaseClient> {
  if (!accountsEnabled) return Promise.reject(new Error('accounts-off'))
  client ??= import('@supabase/supabase-js').then(({ createClient }) =>
    createClient(URL_!, KEY!, { auth: { persistSession: true, detectSessionInUrl: true } }),
  )
  return client
}

function toUser(u: User | null | undefined): AccountUser | null {
  if (!u) return null
  const meta = (u.user_metadata ?? {}) as { full_name?: string; name?: string }
  return { id: u.id, email: u.email ?? null, name: meta.full_name ?? meta.name ?? null }
}

/** Calls back now and on every sign-in or sign-out. Returns an unsubscribe. */
export function watchUser(cb: (u: AccountUser | null) => void): () => void {
  if (!accountsEnabled) return () => {}
  let off = () => {}
  let cancelled = false
  supabase().then(async (sb) => {
    if (cancelled) return
    const { data } = await sb.auth.getSession()
    cb(toUser(data.session?.user))
    const sub = sb.auth.onAuthStateChange((_e, session) => cb(toUser(session?.user)))
    off = () => sub.data.subscription.unsubscribe()
  }, () => {})
  return () => { cancelled = true; off() }
}

/** Emails a one-tap sign-in link that brings them back to this page. */
export async function sendSignInLink(email: string): Promise<void> {
  const sb = await supabase()
  const { error } = await sb.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + window.location.pathname } })
  if (error) throw error
}

export async function signInWithGoogle(): Promise<void> {
  const sb = await supabase()
  const { error } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + window.location.pathname } })
  if (error) throw error
}

export async function signOut(): Promise<void> {
  const sb = await supabase()
  await sb.auth.signOut()
}

/** Everything that follows a person between devices. */
export interface CloudData {
  profile: unknown
  favorites: string[]
  wishlist: unknown[]
  updatedAt: string
}

export async function loadCloud(userId: string): Promise<CloudData | null> {
  const sb = await supabase()
  const { data, error } = await sb.from('profiles').select('data, updated_at').eq('id', userId).maybeSingle()
  if (error) throw error
  return data ? { ...(data.data as Omit<CloudData, 'updatedAt'>), updatedAt: data.updated_at as string } : null
}

export async function saveCloud(userId: string, d: Omit<CloudData, 'updatedAt'>): Promise<void> {
  const sb = await supabase()
  const { error } = await sb.from('profiles').upsert({ id: userId, data: d, updated_at: new Date().toISOString() })
  if (error) throw error
}

export async function deleteCloud(userId: string): Promise<void> {
  const sb = await supabase()
  const { error } = await sb.from('profiles').delete().eq('id', userId)
  if (error) throw error
}

export interface ProblemReport {
  eventId: string
  eventTitle: string
  eventUrl?: string
  reason: string
  note: string
  createdAt: string
}

/** Sends a "Report a problem" note to the reports table (anyone can file one). */
export async function submitReport(r: ProblemReport): Promise<void> {
  const sb = await supabase()
  const { error } = await sb.from('reports').insert({
    event_id: r.eventId, event_title: r.eventTitle, event_url: r.eventUrl ?? null, reason: r.reason, note: r.note,
  })
  if (error) throw error
}
