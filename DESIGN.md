# The Scene: design guidelines

The Scene helps 20–40 year olds find something fun nearby and get friends to
come. It should feel **warm, grounded, and a little editorial**: like a local
magazine's weekend picks, not a ticketing site. Every new screen follows these
rules. The source of truth for values is `src/index.css` (`:root` and the
"EARTHY VERSION" block).

## Color

Cream paper, deep forest olive, and four warm accents. There is a light and a
dark mode: Auto follows the phone, and the You tab (and the landing page's
nav) lets people pick. Dark mode swaps surfaces, text and lines
(`[data-scene-theme='dark']` in `src/index.css` and `src/landing/landing.css`);
art and category colors stay the same. In dark mode the main button is deep clay
(`#A64B32`) with cream text. New colors must work in both: use the tokens, not hex values.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F4EFE6` | Page background (cream paper) |
| `--surface` | `#FBF8F2` | Cards, sheets, inputs |
| `--tile` | `#EAE2D3` | Quiet fills: mood tiles, chips' hover, pills |
| `--ink` | `#23251B` | Text and icons |
| `--ink-2` | `#5C5D4C` | Secondary text (6:1 on `--bg`) |
| `--line` / `--line-strong` | `#E0D7C6` / `#C7BCA7` | Dividers / control borders |
| `--primary` | `#3A3D27` | Main buttons, selected chips and tabs |
| `--forest` | `#2F3424` | Hero panel, setup card |
| `--blush` | `#E7C3B1` | Soft accent: avatars, selected checks |
| `--clay` | `#B5543A` | Energetic accent: Surprise me, skips, saved hearts |
| `--mustard` | `#D6A243` | Warm accent in art and icons |
| `--sand` | `#D9CBB2` | Neutral accent |

Rules:
- One `--primary` button per view; everything else is outlined or a text link.
- Accent colors are for art and small highlights, never for long text.
- Text on blush, sand, or mustard uses `--ink` or `#3F4030`, never `--ink-2`.
- Every text color pair must pass WCAG AA (4.5:1; 3:1 for 24px+). The e2e and
  axe checks enforce this; keep them at zero issues.

### Category colors

Used in card art, weekend icons, and map pins (`[data-pal='earth']` rules and
`.wkc--*`):

| Category | Main | Accent |
|---|---|---|
| Live music | `#8C4A3B` terracotta | `#D98B5F` |
| Sports | `#3F5A3C` moss | `#8FA35B` |
| Theater & shows | `#B5543A` clay | `#E59A6B` |
| Arts | `#C4895B` / blush | `#EAC9A0` |
| Food & drink | `#C99A2E` mustard | `#E8C07A` |
| Outdoors | `#2F5D62` lake teal | `#7FA39A` |
| Family | `#6B7B3A` olive | `#B7C47A` |

## Type

Three families, each with one job:

- **Instrument Serif** (400 only): headlines, event titles, section titles.
  Never bold it (no faux bold). Sizes: page 2.6–4rem, section 1.85rem, event
  title 1.3–1.4rem, sheet title 2.1rem.
- **Bricolage Grotesque** (800, tracked 0.1em, uppercase): the "THE SCENE"
  wordmark only.
- **Figtree**: everything you read or tap. Body 1rem, meta 0.9375rem, small
  0.8125rem, micro labels 0.6875rem uppercase with 0.06–0.08em tracking.

Times, prices, and counts use tabular numbers.

## Shape and space

- Radii: controls 10px (`--r-sm`), cards and panels 14px (`--r-md`), large
  panels 20px (`--r-lg`), pills and chips fully round.
- Touch targets are at least 44×44px (the heart has an invisible 44px area).
- Spacing steps: 4, 8, 12, 16, 20, 28, 32px. More space above a heading than
  below it.
- One elevation per element: a soft shadow or a 1px border, not both.

## Components

- **Event card**: art or photo (date stub top-left, heart top-right, category
  label), serif title, time (+ weather for outdoor events), venue · town,
  one-line description, price row with at most two pills.
- **Card art**: when there's no photo, soft blended category colors with a
  frosted icon tile in the corner. Organizer photos (Ticketmaster, libraries,
  Clemson) replace the art, warmed slightly (`saturate(.85) sepia(.12)`).
- **Sheets**: bottom sheet on phones, centered panel on wide screens. The
  event sheet keeps Save + Invite friends pinned at the bottom.
- **In-app page viewer**: outside links open full screen with Back, the site
  name, and Open in browser.
- **Chips**: outlined; selected = `--primary` fill.
- **Toast**: dark pill at the bottom, 6 seconds, with Undo when an action
  can be reversed.

## Motion

Motion explains what changed; it never decorates.

- Easing: `--ease-out` (`cubic-bezier(.16,1,.3,1)`). Durations: feedback
  120ms, state 200ms, layout 380ms, focal 700ms.
- Allowed: list changes through View Transitions, sheets sliding up, a small
  pop on hearts and selections, photos easing in, the hero photos
  cross-fading.
- Everything has a `prefers-reduced-motion` path that keeps the change but
  drops the movement.

## Voice

Friendly, short, local. Talk like a friend who knows what's on this weekend.

- Say what happens: "Get tickets", "Text 2 friends together", "Not for me".
- Name the problem and the way out: "That event has ended or isn't listed
  anymore. Here's what else is on."
- No jargon ("API", "sync error"), no exclamation marks in errors, no "Oops".
- Sample data is always labeled as sample. Never present a guess as fact.
- Contractions are fine. Sentence case everywhere except the wordmark.

## States every screen needs

Loading (skeletons in the card shape), empty (what to try next), error (what
happened and a retry), offline (saved items still work), and sample/demo
(clearly labeled).
