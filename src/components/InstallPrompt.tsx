import { Download, Share, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { APP_NAME } from '../config'
import { detectPlatform } from '../lib/share'
import { readJSON, writeJSON } from '../lib/storage'

const DISMISS_KEY = 'scene.installDismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/**
 * "Add to Home Screen". Android and desktop Chrome get a real install button;
 * iPhone gets the two-step Share-menu instructions, since Safari has no
 * install button a page can trigger. Hidden once installed or dismissed.
 */
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [dismissed, setDismissed] = useState(() => readJSON(DISMISS_KEY, false))
  const [platform] = useState(() => detectPlatform())
  const [standalone] = useState(isStandalone)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    writeJSON(DISMISS_KEY, true)
  }

  if (standalone || dismissed) return null
  if (!deferred && platform !== 'ios') return null

  return (
    <aside className="install" aria-label={`Install ${APP_NAME}`}>
      <img className="install__icon" src={`${import.meta.env.BASE_URL}icon-192.png`} alt="" width={44} height={44} />
      <div className="install__text">
        <p className="install__title">Put {APP_NAME} on your home screen</p>
        {deferred ? (
          <p className="install__sub">Opens full screen, like an app. No app store needed.</p>
        ) : (
          <p className="install__sub">
            In Safari, tap <Share size={14} strokeWidth={2.5} aria-label="Share" className="install__inline" /> then
            “Add to Home Screen.”
          </p>
        )}
      </div>
      {deferred && (
        <button
          type="button"
          className="btn install__btn"
          onClick={async () => {
            await deferred.prompt()
            await deferred.userChoice
            setDeferred(null)
          }}
        >
          <Download size={16} strokeWidth={2.5} aria-hidden="true" /> Install
        </button>
      )}
      <button type="button" className="icon-btn install__x" aria-label="Not now" onClick={dismiss}>
        <X size={18} strokeWidth={2.25} aria-hidden="true" />
      </button>
    </aside>
  )
}
