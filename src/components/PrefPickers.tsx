import { Accessibility, Ban, Check, Dog, Plus, Users, X, type LucideIcon } from 'lucide-react'
import { INTEREST_ICONS } from './interestIcons'
import {
  BUDGET_LABELS, COMPANY_LABELS, GOES_OUT_LABELS, INTERESTS, NEED_LABELS, TRAVEL_OPTIONS,
  type Budget, type Company, type GoesOut, type Need, type Profile,
} from '../lib/profile'


const NEED_ICONS: Record<Need, LucideIcon> = { accessible: Accessibility, 'alcohol-free': Ban, 'dog-friendly': Dog, 'all-ages': Users }

type Update = (patch: Partial<Profile>) => void

function toggle<T>(list: T[], v: T): T[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v]
}

/** Big tappable interest tiles. `mode` decides whether a tap likes or skips. */
export function InterestPicker({ profile, update, mode }: { profile: Profile; update: Update; mode: 'likes' | 'skips' }) {
  const list = mode === 'likes' ? profile.likes : profile.skips
  const other = mode === 'likes' ? profile.skips : profile.likes
  return (
    <div className="interests" role="group" aria-label={mode === 'likes' ? 'Things you’re into' : 'Things you’d rather skip'}>
      {INTERESTS.map((i) => {
        const on = list.includes(i.id)
        const taken = other.includes(i.id)
        const Icon = INTEREST_ICONS[i.id]
        return (
          <button
            key={i.id}
            type="button"
            className={`interest${on ? ` interest--${mode === 'likes' ? 'like' : 'skip'}` : ''}`}
            aria-pressed={on}
            disabled={taken}
            title={taken ? (mode === 'skips' ? 'You said you’re into this' : 'You said you’d skip this') : undefined}
            onClick={() => update({ [mode]: toggle(list, i.id) } as Partial<Profile>)}
          >
            <Icon size={20} strokeWidth={2} aria-hidden="true" />
            <span>{i.label}</span>
            <span className="interest__mark" aria-hidden="true">
              {on ? (mode === 'likes' ? <Check size={14} strokeWidth={3} /> : <X size={14} strokeWidth={3} />) : <Plus size={14} strokeWidth={2.5} />}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function Chips<T extends string>({ label, options, value, multi, onChange }: {
  label: string
  options: Record<T, string>
  value: T[]
  multi: boolean
  onChange: (v: T[]) => void
}) {
  return (
    <fieldset className="pref">
      <legend className="pref__label">{label}</legend>
      <div className="chips">
        {(Object.keys(options) as T[]).map((k) => {
          const on = value.includes(k)
          return (
            <button key={k} type="button" className={`chip${on ? ' chip--on' : ''}`} aria-pressed={on}
              onClick={() => onChange(multi ? toggle(value, k) : [k])}>
              {options[k]}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

/** Budget, timing, company, travel distance, and needs. */
export function StylePicker({ profile, update, showTravel = true }: { profile: Profile; update: Update; showTravel?: boolean }) {
  return (
    <div className="prefs">
      <Chips<Budget> label="Budget for a night out" options={BUDGET_LABELS} value={[profile.budget]} multi={false} onChange={([b]) => update({ budget: b })} />
      <Chips<GoesOut> label="When do you usually go out?" options={GOES_OUT_LABELS} value={profile.goesOut} multi onChange={(v) => update({ goesOut: v })} />
      <Chips<Company> label="Who do you go with?" options={COMPANY_LABELS} value={profile.company} multi onChange={(v) => update({ company: v })} />
      {showTravel && (
        <Chips<string>
          label="How far will you drive?"
          options={Object.fromEntries(TRAVEL_OPTIONS.map((m) => [String(m), `${m} mi`]))}
          value={[String(profile.travelMiles)]}
          multi={false}
          onChange={([m]) => update({ travelMiles: Number(m) })}
        />
      )}
      <fieldset className="pref">
        <legend className="pref__label">Good to know <span className="pref__opt">(optional)</span></legend>
        <div className="chips">
          {(Object.keys(NEED_LABELS) as Need[]).map((k) => {
            const on = profile.needs.includes(k)
            const Icon = NEED_ICONS[k]
            return (
              <button key={k} type="button" className={`chip chip--icon${on ? ' chip--on' : ''}`} aria-pressed={on}
                onClick={() => update({ needs: toggle(profile.needs, k) })}>
                <Icon size={15} strokeWidth={2.25} aria-hidden="true" /> {NEED_LABELS[k]}
              </button>
            )
          })}
        </div>
      </fieldset>
    </div>
  )
}
