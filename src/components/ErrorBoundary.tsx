import { Component, type ReactNode } from 'react'
import { reportError } from '../lib/monitoring'

interface State { failed: boolean }

/** If something breaks, show a calm, branded screen with a way back instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown): void {
    reportError(error, 'render')
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <main className="crash" role="alert">
        <svg className="crash__mark" viewBox="214 87 212 318" aria-hidden="true">
          <path d="M219,188 A96,96 0 0 1 315,92 L315,188 Z" fill="#B5543A" />
          <rect x="325" y="92" width="96" height="96" rx="8" fill="#D6A243" />
          <path d="M315,294 A96,96 0 0 1 219,198 L315,198 Z" fill="#4E5A35" />
          <path d="M325,198 A96,96 0 0 1 421,294 L325,294 Z" fill="#E7C3B1" />
          <rect x="219" y="304" width="96" height="96" rx="8" fill="#2F3424" />
          <path d="M421,304 A96,96 0 0 1 325,400 L325,304 Z" fill="#8C4A3B" />
        </svg>
        <h1 className="crash__title">That didn’t go as planned</h1>
        <p className="crash__text">Something on this page broke. Your saved events and profile are safe on this device.</p>
        <button type="button" className="btn btn--lg" onClick={() => { window.location.href = '/' }}>Back to The Scene</button>
      </main>
    )
  }
}
