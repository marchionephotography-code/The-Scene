import { Flag } from 'lucide-react'
import { useId, useState } from 'react'
import { SUPPORT_EMAIL } from '../config'
import { accountsEnabled, submitReport, type ProblemReport } from '../lib/account'
import { mailtoHref } from '../lib/share'
import { readJSON, writeJSON } from '../lib/storage'
import type { SceneEvent } from '../types/event'

const REASONS = ['Wrong date or time', 'It’s cancelled', 'Wrong price', 'Wrong place', 'Link doesn’t work', 'Something else'] as const

interface Props {
  event: SceneEvent
  /** Hide the event for this person (used when they say it's cancelled). */
  onHide: () => void
}

/** A quiet link that opens a short form. Reports reach the team; a "cancelled" report also hides the event. */
export function ReportProblem({ event, onHide }: Props) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [note, setNote] = useState('')
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const id = useId()

  const send = async () => {
    const r: ProblemReport = { eventId: event.id, eventTitle: event.title, eventUrl: event.url, reason, note: note.trim().slice(0, 1000), createdAt: new Date().toISOString() }
    setState('sending')
    writeJSON('scene:reports', [r, ...readJSON<ProblemReport[]>('scene:reports', [])].slice(0, 50))
    if (accountsEnabled) await submitReport(r).catch(() => {})
    if (SUPPORT_EMAIL) {
      window.open(mailtoHref(`Problem with “${event.title}”`, `${reason}\n\n${r.note}\n\nEvent: ${event.title} (${event.id})${event.url ? `\n${event.url}` : ''}`, SUPPORT_EMAIL), '_blank')
    }
    setState('done')
    if (reason === 'It’s cancelled') window.setTimeout(onHide, 1200)
  }

  if (state === 'done') {
    return <p className="report__done" role="status">Thanks for the heads-up. We’ll check it.{reason === 'It’s cancelled' ? ' We’ve hidden it for you.' : ''}</p>
  }

  if (!open) {
    return (
      <button type="button" className="link-btn report__open" onClick={() => setOpen(true)}>
        <Flag size={15} strokeWidth={2.25} aria-hidden="true" /> Report a problem
      </button>
    )
  }

  return (
    <form className="report" onSubmit={(e) => { e.preventDefault(); if (reason) void send() }} aria-labelledby={`${id}-h`}>
      <p id={`${id}-h`} className="report__title">What’s wrong with this listing?</p>
      <div className="chips" role="radiogroup" aria-label="Problem">
        {REASONS.map((r) => (
          <button key={r} type="button" role="radio" aria-checked={reason === r} className={`chip${reason === r ? ' chip--on' : ''}`} onClick={() => setReason(r)}>
            {r}
          </button>
        ))}
      </div>
      <label className="field-label" htmlFor={`${id}-n`}>Anything else? <span className="pref__opt">(optional)</span></label>
      <textarea id={`${id}-n`} className="input input--area" rows={2} maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. The new date is Dec 5" />
      <div className="report__actions">
        <button type="submit" className="btn" disabled={!reason || state === 'sending'}>Send report</button>
        <button type="button" className="link-btn" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  )
}
