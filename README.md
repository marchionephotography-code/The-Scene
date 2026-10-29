# The-Scene
Event web app. That helps take the guess work out of planning fun excursions for families, friends, date, anniversary etc. 

## Running it

```bash
npm install
npm run dev        # local dev server
npm test           # unit tests (filters, date shortcuts, money formatting)
npm run typecheck && npm run lint && npm run build
```

## What's built so far

**Event discovery** (mobile-first): "What do you feel like doing?" mood picker, date shortcuts (Tonight, Tomorrow, This weekend, custom range), optional search, filters for category, distance, price, and age, active-filter chips with reset, and "Matches:" reasons on each event.

## Data

All events are **sample data** (`src/data/sampleEvents.ts`) — invented events at fictional venues around the Upstate, labeled "Sample" in the app and `source: "sample"` in code. Screens only get events through `src/data/eventSource.ts`; swap that for a real event API later.
