# Contributing to PackLight

PackLight is a cognitive load management tool. It helps people see, quantify, and manage what they carry — stress, relationships, goals, obligations, skills, identity.

## Getting Started

```bash
git clone https://github.com/mrpickering/packlight.git
cd packlight
npm install
npm run dev
```

## Architecture

- **React 19 + TypeScript + Vite** — SPA, no backend
- **Zustand** — State management, persisted to localStorage
- **Tailwind CSS v4** — Styling
- **Framer Motion** — Animations
- **Recharts** — Charts

### Key concepts

- **PackItem** — Everything you carry. Has weight (energy cost) and utility (value). Can be nested (parent/child).
- **Compartments** — Six categories: Emotions, Responsibilities, Abilities, Resources, Goals, Identity.
- **Weight Dimensions** — Sub-items are rated across stress, worry, mental load, urgency, and emotional charge (1-5 each).
- **Load Balance** — Score (0-100) combining demands, resources, recovery, capacity, and strain.
- **Recovery Check-ins** — Daily micro check-ins (sleep, activity, social, downtime, reflection).
- **Contexts** — Filtered views for different life scenarios (work, home, social, creative).
- **Display Modes** — Different UI patterns for different cognitive styles (focused, structured, low-energy, gentle).

### File structure

```
src/
  types/index.ts        — All type definitions
  store/index.ts        — Zustand store, actions, computed helpers
  utils/
    loadBalance.ts      — Load Balance formula
    weightDecay.ts      — Time-based weight changes
    autoCategorize.ts   — Keyword-based item categorization
    api.ts              — AI features (optional, requires API key)
  components/
    onboarding/         — First-run flow
    pack/               — Main pack view, compartment detail
    items/              — Add/edit items, release ritual
    journal/            — Journal entries
    agents/             — AI agent feed
    repack/             — Weekly repack flow
    trail/              — Progress tracking
    settings/           — Settings, export/import
    shared/             — Reusable components
```

## Building Integrations

PackLight's data model is designed for external integration:

### Data access

All state lives in a single Zustand store persisted to localStorage under `packlight-store`. The `PackItem` type includes:

- `metadata: Record<string, unknown>` — Extensible key-value store for integration data
- `sourceRef: string` — Reference to external data source (e.g., `gcal:event-123`, `obsidian:note-path`)
- `parentId: string | null` — Tree structure, exportable as a directed graph
- `tags: string[]` — Cross-cutting labels for filtering and linking

### Knowledge graph export

Items form a tree via `parentId`. To export for Obsidian or other graph tools:
- Each item becomes a node
- `parentId` creates edges
- Cross-compartment children create cross-category links
- Tags create implicit relationships

### Calendar/email integration

The `sourceRef` field links items to external sources. An integration would:
1. Scan external data (calendar events, email threads)
2. Suggest items via the store's `addItem` action
3. Set `sourceRef` to maintain the link
4. Store integration metadata in `metadata`

### AI features

AI features (agent conversations, journal analysis) are optional. They require an Anthropic API key stored in localStorage. The app works fully without AI — all core features (items, weights, recovery, contexts) are local-only.

## Display Modes

PackLight supports different UI modes for different cognitive styles:

- **Default** — Full interface, all features visible
- **Focused** — One item at a time, minimal navigation (designed for ADHD)
- **Structured** — Full tree view, explicit categories, predictable layout
- **Low-energy** — Top-level items only, one-tap interactions, minimal cognitive demand
- **Gentle** — Progress-oriented framing, no alarming totals

These are different information density and navigation patterns, not visual themes.

## Guidelines

- Keep the core dependency-free (no backend, no accounts, no tracking)
- AI features must always be optional
- Respect that this tool handles sensitive personal data — it never leaves the browser
- Test with the "would this make someone anxious?" filter — if showing a number or message could increase stress rather than reduce it, reconsider
- The app's value is in the transfer (naming what you carry) and the visibility (seeing it all) — not in prescribing solutions

## Pull Requests

- One feature per PR
- Run `npm run build` before submitting (TypeScript must compile clean)
- Update store migration version if you change the persisted data shape
- Test backward compatibility — existing localStorage data must survive upgrades
