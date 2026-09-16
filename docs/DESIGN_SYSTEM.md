# HappyHouse — Design System

Source of truth: `frontend/tailwind.config.ts` and `frontend/app/globals.css`. This document explains the *why*; those files are the authoritative values.

---

## Brand

Colors are sampled directly from the HappyHouse logo (`frontend/public/logo.png`), not invented:

| Token | Light mode | Dark mode | Role |
|---|---|---|---|
| `paper` | `#F6F4EE` | `#0A101A` | Page background |
| `ink` | `#0B1D34` (navy) | `#E4E6EB` | Body text |
| `stone` | `#626773` | `#96999A3`-ish grey | Muted/secondary text |
| `line` | `#DDE0E3` | `#232A36` | Borders, dividers |
| `lake` | `#EFA608` (gold) | brightened gold | Primary interactive accent — buttons, links, focus rings, active states |
| `clay` | muted bronze | brightened bronze | Secondary accent — "Featured" badges, alerts |
| `night` | `#0B1D34` (fixed, never themed) | — | Hero, footer, admin nav, image overlays, lightbox — sections deliberately dark regardless of light/dark mode |
| `cream` | `#F6F4EE` (fixed, never themed) | — | Text/content that must stay legible on `night` |

**Why `lake`/`clay`/`night`/`cream` as names, not `navy`/`gold`**: these token names originated from an earlier placeholder palette and were kept during the rebrand to avoid a large, risky rename across ~25 component files. The *values* are the real brand; the names are legacy. A future full rename is possible but wasn't worth the regression risk given the number of files involved.

**Light/dark mode** is implemented via CSS custom properties (`--color-*` in `globals.css`) that Tailwind reads through the `rgb(var(--color-x) / <alpha-value>)` pattern — this means every existing `bg-paper`/`text-ink`/etc. utility automatically respects the toggle with no per-component changes needed. Only sections that are *intentionally* always-dark (hero, footer, admin nav, login screen backdrop, image lightbox, card image-overlay badges) are pinned to the fixed `night`/`cream` tokens instead, so they don't wash out when the rest of the site flips to dark mode.

---

## Typography

- **Display** (`font-display`): Fraunces — headlines, prices, section titles. Has real character (soft-serif, slightly quirky forms) rather than a generic sans-everything look.
- **Body** (`font-body`): IBM Plex Sans — everything else. Chosen for legibility and Indian-language-adjacent character support over the more common (and more visually generic) Inter.

---

## Spacing & shape

- Border radius: a single `rounded-card` (6px) token used everywhere — cards, buttons, inputs, badges. No mixing of radii within one view.
- No drop shadows on repeated content cards (property cards, area cards) — a hairline `border-line` provides separation instead. Shadow is reserved for genuinely floating/elevated elements (the hero search panel, toasts).
- Motion on hover is restrained to what the interaction implies: image zoom on card hover, border-color change, no unrelated bounce/scale on the whole card.

---

## Layout patterns

- **Public content pages** (`/contact`, `/about`) are capped at `max-w-5xl`, centered — deliberate for readability on wide monitors, not a bug (came up during development as a "too much whitespace" report; the fix was tightening structure and adding real content, not removing the max-width).
- **Property/area card grids**: `sm:grid-cols-2 lg:grid-cols-3`, 6-unit gap.
- **Admin pages**: no sidebar; a persistent top nav (`AdminNav`, pinned to `night`/`cream`) plus page content below. Chosen over a sidebar for simplicity given the small number of admin sections.

---

## Motion principles

- **One orchestrated moment, not continuous looping.** The homepage hero background is a set of topographic contour lines (evoking Thane's lakes/hills — grounded in the actual brief, not decorative) that draw themselves in once on load, then stay still. An earlier version used continuously-drifting gradient blobs; this was deliberately replaced as a generic AI-landing-page tell.
- **`prefers-reduced-motion` is respected globally** — see the media query in `globals.css` and the `useReducedMotion()` checks in animated components (`HeroBackground`, `PropertyCard`, `PropertyGallery`).
- Scroll-reveal on property cards (`whileInView`) is subtle (16px rise, 0.4s) and fires once, not on every scroll into view.

---

## Accessibility

- Visible focus outline on every interactive element (`:focus-visible` in `globals.css`), never removed without a replacement.
- All images have real `alt` text (property title, area name); decorative SVGs are marked `aria-hidden`.
- Color is never the only signal — status badges pair color with text ("Sold", "Featured"), not color alone.
- Modals (image lightbox, mobile filter drawer) trap scroll and support Escape/keyboard navigation.

---

## Known gaps

- No dedicated print stylesheet.
- No automated visual regression testing — design consistency is currently maintained by convention and manual review, not tooling.
