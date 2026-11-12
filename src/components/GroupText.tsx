import { BookUser, Check, MessageCircle, Plus, X } from 'lucide-react'
import { useId, useState } from 'react'
import { useFriends } from '../hooks/useFriends'
import { isPhone, smsGroupHref, type Platform } from '../lib/share'

interface Props {
  message: string
  platform: Platform
}

interface ContactsApi {
  select: (props: string[], opts: { multiple: boolean }) => Promise<{ name?: string[]; tel?: string[] }[]>
}

/**
 * Text the plan to several friends in one group message. Pick from saved
 * friends, add new ones, or (on Android Chrome) pull from contacts.
 */
export function GroupText({ message, platform }: Props) {
  const { friends, add, remove } = useFriends()
  const [picked, setPicked] = useState<string[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const id = useId()
  const contacts = (typeof navigator !== 'undefined' ? (navigator as Navigator & { contacts?: ContactsApi }).contacts : undefined)

  const chosen = friends.filter((f) => picked.includes(f.id))
  const href = smsGroupHref(chosen.map((f) => f.phone), message, platform)

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
    try {
      const people = await contacts!.select(['name', 'tel'], { multiple: true })
      const ids: string[] = []
      for (const p of people) {
        const tel = p.tel?.[0]
        if (tel && isPhone(tel)) {
          const f = add(p.name?.[0] ?? '', tel)
          if (f) ids.push(f.id)
        }
      }
      setPicked((p) => [...p, ...ids.filter((x) => !p.includes(x))])
    } catch {
      // Picker closed; nothing to do.
    }
  }

  return (
    <div className="gtext">
      <div className="gtext__head">
        <p className="gtext__title">Text your crew</p>
        {friends.length > 0 && (
          <button type="button" className="link-btn" onClick={() => setEditing((e) => !e)}>{editing ? 'Done' : 'Edit'}</button>
        )}
      </div>

      {friends.length > 0 ? (
        <ul className="gtext__friends" aria-label="Friends">
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
                  <button type="button" className={`friend${on ? ' friend--on' : ''}`} aria-pressed={on}
                    onClick={() => setPicked((p) => (on ? p.filter((x) => x !== f.id) : [...p, f.id]))}>
                    <span className="friend__avatar" aria-hidden="true">{on ? <Check size={14} strokeWidth={3} /> : f.name.slice(0, 1).toUpperCase()}</span>
                    {f.name}
                  </button>
                )}
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="hint">Add the friends you make plans with. Next time it’s one tap to text them all.</p>
      )}

      <div className="gtext__add">
        <label className="sr-only" htmlFor={`${id}-n`}>Friend’s name</label>
        <input id={`${id}-n`} className="input" placeholder="Name" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        <label className="sr-only" htmlFor={`${id}-p`}>Friend’s phone number</label>
        <input id={`${id}-p`} className="input" type="tel" inputMode="tel" placeholder="Phone number" autoComplete="off" value={phone}
          onChange={(e) => { setPhone(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') addFriend() }}
          aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : undefined} />
        <button type="button" className="round-btn" aria-label="Add friend" onClick={addFriend}>
          <Plus size={18} strokeWidth={2.5} aria-hidden="true" />
        </button>
      </div>
      {error && <p id={`${id}-err`} className="hint hint--error" role="alert">{error}</p>}
      {contacts && typeof contacts.select === 'function' && (
        <button type="button" className="link-btn gtext__contacts" onClick={fromContacts}>
          <BookUser size={16} strokeWidth={2.25} aria-hidden="true" /> Choose from contacts
        </button>
      )}

      <a className={`btn btn--lg gtext__send${chosen.length ? '' : ' gtext__send--plain'}`} href={href}>
        <MessageCircle size={18} strokeWidth={2.25} aria-hidden="true" />
        {chosen.length === 0 ? 'Open Messages' : chosen.length === 1 ? `Text ${chosen[0].name}` : `Text ${chosen.length} friends together`}
      </a>
      <p className="hint">Names and numbers stay on this phone.</p>
    </div>
  )
}
