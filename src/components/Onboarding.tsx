import { ArrowLeft, Mail, MapPin } from 'lucide-react'
import { useId, useState } from 'react'
import { APP_NAME } from '../config'
import type { ProfileApi } from '../hooks/useProfile'
import { sendSignInLink, signInWithGoogle } from '../lib/account'
import { searchLocal, type Place } from '../lib/geocode'
import { TRAVEL_OPTIONS } from '../lib/profile'
import { LogoMark } from './LogoMark'
import { InterestPicker, StylePicker } from './PrefPickers'
import { Sheet } from './Sheet'

interface Props {
  open: boolean
  api: ProfileApi
  onClose: () => void
  /** Called when they finish, with their home base (if they set one). */
  onDone: (home: Place | null) => void
}

const STEPS = ['welcome', 'you', 'into', 'skip', 'style'] as const
type Step = (typeof STEPS)[number]

const TITLES: Record<Step, string> = {
  welcome: `Welcome to ${APP_NAME}`,
  you: 'About you',
  into: 'What are you into?',
  skip: 'Anything to skip?',
  style: 'How you go out',
}

/**
 * First-run setup: five short steps, every one skippable. Nothing here is
 * required to use the app; it just makes the picks better.
 */
export function Onboarding({ open, api, onClose, onDone }: Props) {
  const { profile, update, user, accountsEnabled } = api
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const id = useId()
  const [cityQuery, setCityQuery] = useState(profile.home?.label ?? '')
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  const cities = cityQuery.trim().length >= 2 && cityQuery !== profile.home?.label ? searchLocal(cityQuery, 5) : []

  const finish = () => {
    update({ onboarded: true })
    onDone(profile.home)
    setI(0)
  }
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish())
  const skipAll = () => {
    update({ onboarded: true })
    onClose()
    setI(0)
  }

  const nextLabel =
    step === 'welcome' ? (user ? 'Next' : 'Set up without an account')
    : step === 'into' && profile.likes.length === 0 ? 'Skip this step'
    : step === 'skip' && profile.skips.length === 0 ? 'Nothing to skip'
    : i === STEPS.length - 1 ? 'Show me my scene'
    : 'Next'

  return (
    <Sheet
      open={open}
      title={TITLES[step]}
      onClose={skipAll}
      footer={
        <>
          {i > 0 ? (
            <button type="button" className="link-btn onb__back" onClick={() => setI(i - 1)}>
              <ArrowLeft size={16} strokeWidth={2.5} aria-hidden="true" /> Back
            </button>
          ) : (
            <button type="button" className="link-btn" onClick={skipAll}>Maybe later</button>
          )}
          <button type="button" className="btn btn--lg" onClick={next}>{nextLabel}</button>
        </>
      }
    >
      <div className="onb">
        <ol className="onb__progress" aria-label={`Step ${i + 1} of ${STEPS.length}`}>
          {STEPS.map((s, n) => <li key={s} className={n <= i ? 'is-done' : undefined} aria-current={n === i ? 'step' : undefined} />)}
        </ol>

        {step === 'welcome' && (
          <section className="onb__step onb__welcome">
            <LogoMark height={56} />
            <h3 className="onb__h">Make it yours</h3>
            <p className="onb__p">Tell us what you love and what you’d rather skip. We’ll put the best picks first, wherever you are. It takes about a minute.</p>
            {user ? (
              <p className="onb__signed">Signed in as {user.email ?? user.name}. Your picks will follow you to any device.</p>
            ) : accountsEnabled ? (
              <div className="onb__auth">
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
                <p className="hint" role="status">
                  {sent === 'sent' ? 'Check your email and tap the link to sign in. You can keep setting up meanwhile.'
                    : sent === 'error' ? 'That didn’t go through. Check the address, or set up without an account.'
                    : 'An account saves your picks across phone and computer. No password needed.'}
                </p>
              </div>
            ) : (
              <p className="hint">Saved on this device. Accounts that sync across devices switch on once the app is live.</p>
            )}
          </section>
        )}

        {step === 'you' && (
          <section className="onb__step">
            <label className="pref__label" htmlFor={`${id}-n`}>What should we call you?</label>
            <input id={`${id}-n`} className="input" autoComplete="given-name" placeholder="First name" value={profile.name} onChange={(e) => update({ name: e.target.value })} />

            <label className="pref__label" htmlFor={`${id}-c`}>Where’s home base?</label>
            <div className="onb__city">
              <MapPin size={18} strokeWidth={2.25} aria-hidden="true" />
              <input id={`${id}-c`} className="input" autoComplete="address-level2" placeholder="Search a city" value={cityQuery}
                onChange={(e) => { setCityQuery(e.target.value); if (profile.home) update({ home: null }) }}
                aria-describedby={`${id}-ch`} />
            </div>
            {cities.length > 0 && (
              <ul className="onb__cities" aria-label="Matching cities">
                {cities.map((c) => (
                  <li key={c.label}>
                    <button type="button" className="chip" onClick={() => { update({ home: c }); setCityQuery(c.label) }}>{c.label}</button>
                  </li>
                ))}
              </ul>
            )}
            <p id={`${id}-ch`} className="hint">{profile.home ? `Picks start around ${profile.home.label}. Traveling? Change the city anytime from “Where to?”.` : 'We’ll start your picks here.'}</p>

            <fieldset className="pref">
              <legend className="pref__label">How far will you usually drive?</legend>
              <div className="chips">
                {TRAVEL_OPTIONS.map((m) => (
                  <button key={m} type="button" className={`chip${profile.travelMiles === m ? ' chip--on' : ''}`} aria-pressed={profile.travelMiles === m} onClick={() => update({ travelMiles: m })}>
                    {m} mi
                  </button>
                ))}
              </div>
            </fieldset>
          </section>
        )}

        {step === 'into' && (
          <section className="onb__step">
            <p className="onb__p">Pick as many as you like. These go to the top of your list.</p>
            <InterestPicker profile={profile} update={update} mode="likes" />
          </section>
        )}

        {step === 'skip' && (
          <section className="onb__step">
            <p className="onb__p">We’ll hide these. You can bring them back anytime from the You tab.</p>
            <InterestPicker profile={profile} update={update} mode="skips" />
          </section>
        )}

        {step === 'style' && (
          <section className="onb__step">
            <StylePicker profile={profile} update={update} showTravel={false} />
          </section>
        )}
      </div>
    </Sheet>
  )
}
