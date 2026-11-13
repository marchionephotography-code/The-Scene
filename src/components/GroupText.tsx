import { BookUser, Check, ChevronDown, MessageCircle, Plus, Send, Users, X } from 'lucide-react'
import { useId, useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { readJSON, writeJSON } from '../lib/storage'
import { isPhone, smsGroupHref, smsHref, type Platform } from '../lib/share'

interface Props {
  message: string
  platform: Platform
}

interface ContactsApi {
  select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]>
}

const LAST_CREW = 'scene:last-crew'

function contactPicker(): ContactsApi | null {
  if (typeof navigator === 'undefined') return null
  const c = (navigator as Navigator & { contacts?: ContactsApi }).contacts
  return c && typeof c.select === 'function' ? c : null
}

/**
 * Text the plan to friends, starting from the phone's own contacts:
 * - Phones with the contact picker (Android Chrome): pick several contacts at once.
 * - iPhone: Messages opens with the invite written; add people in To: from contacts.
 * - Share sheet: send straight into an existing group chat.
 * Friends picked here are remembered on this device for one-tap next time.
 */
export function GroupText({ message, platform }: Props) {
  const { friends, add, remove } = useFriends()
  const [picked, setPicked] = useState<string[]>([])
  const [lastCrew] = useState<string[]>(() => readJSON<string[]>(LAST_CREW, []))
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [manual, setManual] = useState(false)
  const [note, setNote] = useState('')
  const id = useId()
  const picker = contactPicker()
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function'

  const chosen = friends.filter((f) => picked.includes(f.id))
  const href = smsGroupHref(chosen.map((f) => f.phone), message, platform)
  const crew = friends.filter((f) => lastCrew.includes(f.id))
  const crewPicked = crew.length > 1 && crew.every((f) => picked.includes(f.id))

  const toggle = (fid: string) => setPicked((p) => (p.includes(fid) ? p.filter((x) => x !== fid) : [...p, fid]))

  const addFriend = () => {
    if (!isPhone(phone)) {
      setError('Enter a full phone number, like 864 555 0101.')
      return
    }
    const f = add(name, phone)
    if (f) setPicked((p) => (p.includes(f.id) ? p : [...p, f.id]))
    setName('')
    setPhone('')
    setError('')
  }

  const fromContacts = async () => {
    if (!picker) return
    try {
      const people = await picker.select(['name', 'tel'], { multiple: true })
      const ids: string[] = []
      let skipped = 0
      for (const p of people) {
        const tel = p.tel?.find((t) => isPhone(t))
        const f = tel ? add(p.name?.[0] ?? '', tel) : null
        if (f) ids.push(f.id)
        else skipped++
      }
      setPicked((p) => [...p, ...ids.filter((x) => !p.includes(x))])
      setNote(
        ids.length
          ? `${ids.length === 1 ? 'Added 1 friend' : `Added ${ids.length} friends`}${skipped ? `. ${skipped} had no phone number.` : '.'}`
          : skipped ? 'Those contacts don’t have a phone number.' : '',
      )
    } catch {
      // Picker closed or not allowed; nothing to do.
    }
  }

  const shareToChat = async () => {
    try { await navigator.share({ text: message }) } catch { /* closed */ }
  }

  const rememberCrew = () => writeJSON(LAST_CREW, picked)

  return (
    <div className="gtext">
      <div className="gtext__head">
        <p className="gtext__title">Text your crew</p>
        {friends.length > 0 && (
          <button type="button" className="link-btn" onClick={() => setEditing((e) => !e)}>{editing ? 'Done' : 'Edit'}</button>
        )}
      </div>

      {/* Start from the phone's contacts */}
      <div className="gtext__ways">
        {picker ? (
          <button type="button" className="way way--main" onClick={fromContacts}>
            <span className="way__icon" aria-hidden="true"><BookUser size={20} strokeWidth={2.25} /></span>
            <span className="way__text"><b>Choose from contacts</b><small>Pick as many people as you like</small></span>
          </button>
        ) : (
          <a className="way way--main" href={smsHref(message)}>
            <span className="way__icon" aria-hidden="true"><BookUser size={20} strokeWidth={2.25} /></span>
            <span className="way__text"><b>Pick friends in Messages</b><small>The invite is written for you. Type names in To: to add people from your contacts.</small></span>
          </a>
        )}
        {canShare && (
          <button type="button" className="way" onClick={shareToChat}>
            <span className="way__icon" aria-hidden="true"><Send size={18} strokeWidth={2.25} /></span>
            <span className="way__text"><b>Send to a group chat</b><small>Your recent chats show up first</small></span>
          </button>
        )}
      </div>
      {note && <p className="hint" role="status">{note}</p>}

      {friends.length > 0 && (
        <>
          <p className="gtext__label">Your friends</p>
          <ul className="gtext__friends" aria-label="Friends">
            {crew.length > 1 && !editing && (
              <li>
                <button type="button" className={`friend friend--crew${crewPicked ? ' friend--on' : ''}`} aria-pressed={crewPicked}
                  onClick={() => setPicked((p) => (crewPicked ? p.filter((x) => !lastCrew.includes(x)) : [...new Set([...p, ...crew.map((f) => f.id)])]))}>
                  <span className="friend__avatar" aria-hidden="true">{crewPicked ? <Check size={14} strokeWidth={3} /> : <Users size={14} strokeWidth={2.5} />}</span>
                  Same crew as last time
                </button>
              </li>
            )}
            {friends.map((f) => {
              const on = picked.includes(f.id)
              return (
                <li key={f.id}>
                  {editing ? (
                    <button type="button" className="friend friend--edit" onClick={() => { remove(f.id); setPicked((p) => p.filter((x) => x !== f.id)) }} aria-label={`Remove ${f.name}`}>
                      <span className="friend__avatar" aria-hidden="true">{f.name.slice(0, 1).toUpperCase()}</span>
                      {f.name}
                      <X size={14} strokeWidth={2.75} aria-hidden="true" />
                    </button>
                  ) : (
                    <button type="button" className={`friend${on ? ' friend--on' : ''}`} aria-pressed={on} onClick={() => toggle(f.id)}>
                      <span className="friend__avatar" aria-hidden="true">{on ? <Check size={14} strokeWidth={3} /> : f.name.slice(0, 1).toUpperCase()}</span>
                      {f.name}
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
        </>
      )}

      {chosen.length > 0 && (
        <a className="btn btn--lg gtext__send" href={href} onClick={rememberCrew}>
          <MessageCircle size={18} strokeWidth={2.25} aria-hidden="true" />
          {chosen.length === 1 ? `Text ${chosen[0].name}` : `Text ${chosen.length} friends together`}
        </a>
      )}

      <button type="button" className="link-btn gtext__toggle" aria-expanded={manual} aria-controls={`${id}-add`} onClick={() => setManual((m) => !m)}>
        <Plus size={16} strokeWidth={2.5} aria-hidden="true" /> Add a number yourself
        <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" className={manual ? 'is-open' : undefined} />
      </button>
      {manual && (
        <div id={`${id}-add`} className="gtext__add">
          <label className="sr-only" htmlFor={`${id}-n`}>Friend’s name</label>
          <input id={`${id}-n`} className="input" placeholder="Name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
          <label className="sr-only" htmlFor={`${id}-p`}>Friend’s phone number</label>
          <input id={`${id}-p`} className="input" type="tel" inputMode="tel" placeholder="Phone number" autoComplete="tel" value={phone}
            onChange={(e) => { setPhone(e.target.value); setError('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') addFriend() }}
            aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} />
          <button type="button" className="round-btn" aria-label="Add friend" onClick={addFriend}>
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>
      )}
      {error && <p id={`${id}-err`} className="hint hint--error" role="alert">{error}</p>}

      <p className="hint">Names and numbers stay on this phone.</p>
    </div>
  )
}
