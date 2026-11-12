import { Cloud, CloudOff, EyeOff, LogOut, Mail, MapPin, RotateCcw, Sparkles, UserRound } from 'lucide-react'
import { useId, useState } from 'react'
import type { ProfileApi } from '../hooks/useProfile'
import { sendSignInLink, signInWithGoogle, signOut } from '../lib/account'
import { likesSummary } from '../lib/profile'
import { InterestPicker, StylePicker } from './PrefPickers'
import { ThemeSwitch } from './ThemeSwitch'

interface Props {
  api: ProfileApi
  /** Opens the setup flow again. */
  onRedoSetup: () => void
}

/** The You tab: who you are, what you like and skip, how you go out, your account. */
export function ProfileView({ api, onRedoSetup }: Props) {
  const { profile, update, reset, user, sync, accountsEnabled } = api
  const id = useId()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [confirmReset, setConfirmReset] = useState(false)
  const initial = (profile.name || user?.name || user?.email || '').trim().slice(0, 1).toUpperCase()

  return (
    <section className="you" aria-labelledby={`${id}-h`}>
      <header className="you__head">
        <span className="you__avatar" aria-hidden="true">{initial || <UserRound size={28} strokeWidth={2} />}</span>
        <div>
          <h1 id={`${id}-h`} className="you__name">{profile.name ? `Hi, ${profile.name}` : 'Your scene'}</h1>
          <p className="you__sub">
            {profile.home && <><MapPin size={14} strokeWidth={2.25} aria-hidden="true" /> {profile.home.label} · </>}
            {likesSummary(profile)}
          </p>
        </div>
      </header>

      {!profile.onboarded && (
        <button type="button" className="you__setup" onClick={onRedoSetup}>
          <Sparkles size={20} strokeWidth={2.25} aria-hidden="true" />
          <span><strong>Take the 1-minute setup</strong><br />Tell us what you love and we’ll put it first.</span>
        </button>
      )}

      <div className="you__section">
        <h2 className="saved__heading">Into</h2>
        <p className="hint">These go to the top of your list.</p>
        <InterestPicker profile={profile} update={update} mode="likes" />
      </div>

      <div className="you__section">
        <h2 className="saved__heading">Skip</h2>
        <p className="hint">Events like these stay hidden.</p>
        <InterestPicker profile={profile} update={update} mode="skips" />
      </div>

      <div className="you__section">
        <h2 className="saved__heading">How you go out</h2>
        <StylePicker profile={profile} update={update} />
      </div>

      <div className="you__section">
        <h2 className="saved__heading">Appearance</h2>
        <p className="hint">Auto matches your phone’s light or dark setting.</p>
        <ThemeSwitch />
      </div>

      {profile.hiddenEvents.length > 0 && (
        <div className="you__section you__row">
          <EyeOff size={18} strokeWidth={2.25} aria-hidden="true" />
          <p>{profile.hiddenEvents.length} {profile.hiddenEvents.length === 1 ? 'event' : 'events'} marked “Not for me”</p>
          <button type="button" className="link-btn" onClick={() => update({ hiddenEvents: [] })}>Show them again</button>
        </div>
      )}

      <div className="you__section">
        <h2 className="saved__heading">Account</h2>
        {user ? (
          <div className="you__account">
            <p className="you__row">
              {sync === 'error' ? <CloudOff size={18} strokeWidth={2.25} aria-hidden="true" /> : <Cloud size={18} strokeWidth={2.25} aria-hidden="true" />}
              <span>
                Signed in as <strong>{user.email ?? user.name}</strong>
                <br />
                <span className="hint" role="status">
                  {sync === 'syncing' ? 'Saving…' : sync === 'error' ? 'Couldn’t sync just now. Your changes are safe on this device.' : 'Your picks, favorites, and wish list sync to every device.'}
                </span>
              </span>
            </p>
            <button type="button" className="save-btn" onClick={() => signOut()}>
              <LogOut size={18} strokeWidth={2.25} aria-hidden="true" /> Sign out
            </button>
          </div>
        ) : accountsEnabled ? (
          <div className="you__account">
            <p className="hint">Sign in to keep your picks, favorites, and wish list on your phone and computer. No password needed.</p>
            <button type="button" className="auth-btn" onClick={() => signInWithGoogle().catch(() => setSent('error'))}>
              <span className="auth-btn__g" aria-hidden="true">G</span> Continue with Google
            </button>
            <form className="onb__email" onSubmit={(e) => {
              e.preventDefault()
              setSent('sending')
              sendSignInLink(email.trim()).then(() => setSent('sent'), () => setSent('error'))
            }}>
              <label className="sr-only" htmlFor={`${id}-e`}>Email</label>
              <input id={`${id}-e`} className="input" type="email" required autoComplete="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              <button type="submit" className="btn" disabled={sent === 'sending'}>
                <Mail size={16} strokeWidth={2.5} aria-hidden="true" /> Email me a link
              </button>
            </form>
            {sent !== 'idle' && sent !== 'sending' && (
              <p className="hint" role="status">{sent === 'sent' ? 'Check your email and tap the link to sign in.' : 'That didn’t go through. Check the address and try again.'}</p>
            )}
          </div>
        ) : (
          <p className="you__row hint">
            <CloudOff size={18} strokeWidth={2.25} aria-hidden="true" />
            Everything is saved on this device. Sign-in that syncs across devices switches on once the app is live.
          </p>
        )}
      </div>

      <div className="you__section you__actions">
        <button type="button" className="save-btn" onClick={onRedoSetup}>
          <Sparkles size={18} strokeWidth={2.25} aria-hidden="true" /> Redo setup
        </button>
        {confirmReset ? (
          <div className="you__confirm" role="group" aria-label="Clear your profile?">
            <p>Clear your likes, skips, and style? Favorites and your wish list stay.</p>
            <button type="button" className="btn" onClick={() => { reset(); setConfirmReset(false) }}>Clear profile</button>
            <button type="button" className="link-btn" onClick={() => setConfirmReset(false)}>Keep it</button>
          </div>
        ) : (
          <button type="button" className="link-btn you__reset" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={16} strokeWidth={2.25} aria-hidden="true" /> Clear my profile
          </button>
        )}
      </div>
    </section>
  )
}
