import type { SceneEvent } from '../types/event'
import { APP_NAME } from '../config'
import { formatPriceRange } from './money'

/** "Sat, Oct 31 · 7:30 PM" */
export function formatShareWhen(startIso: string, locale?: string): string {
  const d = new Date(startIso)
  const day = d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
  const time = d.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })
  return `${day} · ${time}`
}

/**
 * The default message for texting, emailing, or posting an event.
 * Sample events say so, so nobody mistakes a demo listing for a real one.
 */
export function buildShareText(event: SceneEvent, locale?: string): string {
  const lines = [
    `Want to go? ${event.title}`,
    `${formatShareWhen(event.start, locale)} at ${event.venue}, ${event.town}`,
    `Price: ${formatPriceRange(event.price, locale)}`,
  ]
  if (event.source === 'sample') lines.push('', `(Sample listing from the ${APP_NAME} demo, not a real event yet.)`)
  return lines.join('\n')
}

/** Opens Messages with the text filled in. `?&body=` works on both iOS and Android. */
export function smsHref(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`
}

/** Keeps digits and a leading +, e.g. "(864) 555-0101" → "8645550101". */
export function cleanPhone(raw: string): string {
  const t = raw.trim()
  return (t.startsWith('+') ? '+' : '') + t.replace(/\D/g, '')
}

/** A US number needs 10 digits (or 11 starting with 1); others need 8+. */
export function isPhone(raw: string): boolean {
  const c = cleanPhone(raw).replace('+', '')
  return c.length >= 10 && c.length <= 15
}

/**
 * One group text to several people. iPhone wants sms://open?addresses=a,b;
 * Android separates numbers with a semicolon. With no numbers it falls back to
 * a blank Messages draft where you can add people yourself.
 */
export function smsGroupHref(numbers: string[], text: string, platform: 'ios' | 'android' | 'desktop'): string {
  const nums = numbers.map(cleanPhone).filter(Boolean)
  const body = encodeURIComponent(text)
  if (!nums.length) return smsHref(text)
  if (platform === 'ios') return `sms://open?addresses=${nums.join(',')}&body=${body}`
  return `sms:${nums.join(platform === 'android' ? ';' : ',')}?body=${body}`
}

export function mailtoHref(subject: string, body: string, to = ''): string {
  return `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export interface SocialTarget {
  id: 'x' | 'threads' | 'bluesky' | 'whatsapp'
  label: string
  href: string
}

/**
 * Networks that don't accept pre-written text from a web link. The button
 * copies the message first, then opens the app so it can be pasted.
 */
export interface PasteTarget {
  id: 'instagram' | 'tiktok' | 'facebook'
  label: string
  href: string
}

export const PASTE_TARGETS: (PasteTarget & { iosScheme: string; androidPackage: string })[] = [
  { id: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/', iosScheme: 'instagram://app', androidPackage: 'com.instagram.android' },
  { id: 'tiktok', label: 'TikTok', href: 'https://www.tiktok.com/upload', iosScheme: 'snssdk1233://', androidPackage: 'com.zhiliaoapp.musically' },
  { id: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/', iosScheme: 'fb://feed', androidPackage: 'com.facebook.katana' },
]

export type Platform = 'ios' | 'android' | 'desktop'

export function detectPlatform(ua: string = typeof navigator === 'undefined' ? '' : navigator.userAgent): Platform {
  if (/android/i.test(ua)) return 'android'
  // iPadOS reports itself as a Mac; touch support tells them apart.
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios'
  if (/macintosh/i.test(ua) && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1) return 'ios'
  return 'desktop'
}

/**
 * The link that opens the installed app. Android's intent link falls back to
 * the website by itself when the app is missing; iOS has no such fallback, so
 * the screen offers a website link if the app doesn't open.
 */
export function appHref(t: (typeof PASTE_TARGETS)[number], platform: Platform): string {
  if (platform === 'ios') return t.iosScheme
  if (platform === 'android') {
    const url = new URL(t.href)
    return `intent://${url.host}${url.pathname}#Intent;scheme=https;package=${t.androidPackage};S.browser_fallback_url=${encodeURIComponent(t.href)};end`
  }
  return t.href
}

/** Networks that accept a pre-written post from a web link. */
export function socialTargets(text: string): SocialTarget[] {
  const t = encodeURIComponent(text)
  return [
    { id: 'x', label: 'X', href: `https://x.com/intent/post?text=${t}` },
    { id: 'threads', label: 'Threads', href: `https://www.threads.net/intent/post?text=${t}` },
    { id: 'bluesky', label: 'Bluesky', href: `https://bsky.app/intent/compose?text=${t}` },
    { id: 'whatsapp', label: 'WhatsApp', href: `https://wa.me/?text=${t}` },
  ]
}
