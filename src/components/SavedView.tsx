import { Check, ChevronRight, Heart, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Saved } from '../hooks/useSaved'
import { formatShareWhen } from '../lib/share'
import type { SceneEvent } from '../types/event'

interface Props {
  saved: Saved
  events: SceneEvent[]
  onOpen: (eventId: string) => void
  onBrowse: () => void
}

export function SavedView({ saved, events, onOpen, onBrowse }: Props) {
  const [draft, setDraft] = useState('')
  const byId = new Map(events.map((e) => [e.id, e]))
  const favs = saved.favorites.map((id) => byId.get(id)).filter((e): e is SceneEvent => !!e)

  return (
    <section className="saved" aria-labelledby="saved-heading">
      <h1 id="saved-heading" className="title">Saved</h1>

      <div className="saved__group">
        <h2 className="saved__heading">Favorites</h2>
        {favs.length === 0 ? (
          <div className="state state--soft">
            <Heart size={22} strokeWidth={2} aria-hidden="true" />
            <p>Tap the heart on any event to keep it here.</p>
            <button type="button" className="btn" onClick={onBrowse}>Browse ideas</button>
          </div>
        ) : (
          <ul className="rows">
            {favs.map((e) => (
              <li key={e.id} className="saved-row">
                <button type="button" className="row" onClick={() => onOpen(e.id)}>
                  <span className={`thumb cover--${e.category}`} aria-hidden="true" />
                  <span className="row__text">
                    <span className="row__main">{e.title}</span>
                    <span className="row__sub">{formatShareWhen(e.start)} · {e.town}</span>
                  </span>
                  <ChevronRight size={18} strokeWidth={2.25} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="saved__group">
        <h2 className="saved__heading">Wish list</h2>
        <p className="saved__lede">Events you want to get to, plus your own someday ideas.</p>
        <form
          className="wish-add"
          onSubmit={(e) => {
            e.preventDefault()
            saved.addWish(draft)
            setDraft('')
          }}
        >
          <label className="sr-only" htmlFor="wish-input">Add a wish list idea</label>
          <input
            id="wish-input"
            className="input"
            placeholder="e.g. Paddle Lake Jocassee"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button type="submit" className="btn" disabled={!draft.trim()}>
            <Plus size={18} strokeWidth={2.5} aria-hidden="true" /> Add
          </button>
        </form>

        {saved.wishlist.length === 0 ? (
          <p className="agenda__empty">Nothing yet. Add an idea above, or tap “Wish list” on any event.</p>
        ) : (
          <ul className="wish">
            {saved.wishlist.map((w) => {
              const ev = w.eventId ? byId.get(w.eventId) : undefined
              return (
                <li key={w.id} className={`wish__item${w.done ? ' wish__item--done' : ''}`}>
                  <button
                    type="button"
                    className="wish__check"
                    aria-pressed={w.done}
                    aria-label={w.done ? `Mark “${w.text}” as not done` : `Mark “${w.text}” as done`}
                    onClick={() => saved.toggleWishDone(w.id)}
                  >
                    {w.done && <Check size={16} strokeWidth={3} aria-hidden="true" />}
                  </button>
                  <span className="wish__text">
                    {ev ? (
                      <button type="button" className="wish__link" onClick={() => onOpen(ev.id)}>{w.text}</button>
                    ) : (
                      w.text
                    )}
                    {ev && <span className="wish__meta">{formatShareWhen(ev.start)} · {ev.town}</span>}
                  </span>
                  <button type="button" className="icon-btn" onClick={() => saved.removeWish(w.id)} aria-label={`Remove “${w.text}”`}>
                    <Trash2 size={17} strokeWidth={2.25} aria-hidden="true" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="footnote">Saved items stay in this browser on this device.</p>
    </section>
  )
}
