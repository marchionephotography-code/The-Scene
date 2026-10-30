# The-Scene
Event web app (name: The Scene). That helps take the guess work out of planning fun excursions for families, friends, date, anniversary etc. 

## Running it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (filters, date shortcuts, money formatting)
npm run typecheck && npm run lint && npm run build
```

## What's built so far

**Event discovery** (mobile-first, clean marketplace-app style): "What do you feel like doing?" mood picker, date shortcuts (Tonight, Tomorrow, This weekend, custom range), optional search, filters for category, distance, price, and age, active-filter chips with reset, and "Matches:" reasons on each event.

## Data

All events are **sample data** (`src/data/sampleEvents.ts`) — invented events at fictional venues around the Upstate, labeled "Sample" in the app and `source: "sample"` in code. Screens only get events through `src/data/eventSource.ts`; swap that for a real event API later.

## Design

Clean, high-contrast style: lots of white space, near-black type and buttons, soft grey tiles, one violet accent, and light/dark modes. Type: Bricolage Grotesque for headlines and titles, Figtree for everything else — both self-hosted via `@fontsource-variable`, with a fixed role scale (`--fs-*` tokens in `src/index.css`). Icons come from `lucide-react`. Event covers are generated per category (gradient + icon) until real event photos are available.

Motion: when you change a mood, date, or filter, results rearrange with View Transitions (cards glide, new ones focus in, others blur out). Cover icons draw their linework the first time they scroll into view, and covers come alive on hover. Sheets slide in and out, and controls give quick press feedback. All of it respects `prefers-reduced-motion`.

The app name lives in `src/config.ts`, so you can rename it in one place.

## Logo

The Scene's logo is the **Tile S**: six bright tiles forming an S, each holding something to do (string lights, a stage curtain, mountains, a music note, a heart, a sparkle).

- `src/assets/logo/the-scene-icon.svg` and `the-scene-icon-512.png`: full-detail app icon
- `public/favicon.svg`, `public/apple-touch-icon.png`: browser and home-screen icons
- `src/components/LogoMark.tsx`: simplified mark used in the header

Colors: coral `#FF5A36`, sun `#FFC53D`, cobalt `#3D6BFF`, pink `#FF8FC8`, cream `#F4ECDD`, violet `#8B74FF`, ink `#121212`.
