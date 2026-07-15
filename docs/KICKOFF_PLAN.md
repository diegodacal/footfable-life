# Claude Code Kickoff Plan — Football Career RPG Beta

> How to take the design package (five docs + the working prototype) and build a functional beta with Claude Code. Covers setup, architecture, how to feed the docs, a milestone build order with a **ready-to-paste prompt for each**, and how mobile (Android/iOS) migration works.

---

## 0. Prerequisites & setup

**For Claude Code itself** (the native installer is recommended and needs no Node.js):
- macOS / Linux / WSL: `curl -fsSL https://claude.ai/install.sh | bash`
- Windows (PowerShell): `irm https://claude.ai/install.ps1 | iex`
- or Homebrew: `brew install --cask claude-code`
- Verify: `claude --version`, then run `claude` and log in via the browser.
- **You need a paid plan** — Claude Pro, Max, Team, Enterprise, or a Console/API account.
- Official docs: https://docs.claude.com/en/docs/claude-code/overview

**For the game project itself** (this is a web app, so you need a JS toolchain):
- **Node.js LTS** (v20 or v22) and **Git**.
- A free hosting account for the beta URL (Vercel, Netlify, or Cloudflare Pages).

---

## 1. The stack (decided)

- **Vite + React + TypeScript** — fast dev, simple build; lets Claude Code port the prototype rather than start over.
- **Tailwind** for styling (matches the prototype).
- **Zustand** for app state; **Dexie (IndexedDB)** for saves.
- **Vitest** for testing the simulation math.
- Deploy to **Vercel / Netlify / Cloudflare Pages**.

**The one rule that governs everything:** the **simulation engine is pure TypeScript with no React**, and the UI only renders engine state. This keeps the sim testable, lets you balance numbers headlessly, and lets the event library plug in as data.

## 2. Repo architecture

```
football-rpg/
  docs/                      ← drop all 5 design docs + the prototype here
  src/
    engine/                  ← PURE TypeScript. no React, no DOM.
      systems/               ← tick, training, match, selection, status,
                               development, injuries, life-meters, events, economy, world
      data/                  ← JSON: attributes, tuning constants, event library, clubs, nations
      types/                 ← the shared data model
      index.ts               ← the engine's public API (advanceWeek, etc.)
    ui/                      ← React + Tailwind. renders engine state, sends actions.
      screens/
      components/
    state/                   ← Zustand store + Dexie save/load
    main.tsx
  CLAUDE.md                  ← project memory
  package.json
```

## 3. How to feed the docs to Claude Code

1. Put all five docs and `touchline_prototype.jsx` in `docs/`.
2. Create a **`CLAUDE.md`** at the repo root — Claude Code reads this automatically every session.
3. Per milestone, point Claude Code at the specific doc(s) listed below.

## 4. Milestones (each ends with something runnable)

For each: **paste the prompt into Claude Code**, then iterate. Use **Plan Mode** first on the bigger ones (M1, M4, M5). Commit at the end of each.

### M0 — Setup
> Read CLAUDE.md and docs/PROJECT_INSTRUCTIONS.md. Scaffold a Vite + React + TypeScript app with Tailwind and Vitest, using the folder structure in the kickoff plan (engine/ui/state split). Set up Git, a basic CI test script, and a deploy config for Vercel. Create empty module stubs for the engine systems. Get it running locally and confirm `npm run dev` and `npm test` work. Don't build game logic yet.

### M1 — Engine core + one career
**Docs:** PROTOTYPE_SPEC.md, prototype.
> Read docs/PROTOTYPE_SPEC.md and study docs/touchline_prototype.jsx. In src/engine (pure TypeScript, no React), implement the core loop: data model, weekly tick, training (focus + intensity), match resolution with the performance formula, selection + the status ladder (Youth→Backup→Rotation→Regular→Star), development from training + minutes, injuries, readiness and form. Put all tunable numbers in src/engine/data as constants. Write Vitest tests for the development, selection, and match math using fixed seeds. The engine must run a full season headless with no UI.

### M2 — UI shell (playable beta)
**Docs:** prototype.
> Build the React + Tailwind UI in src/ui on top of the engine, matching the look and flow of docs/touchline_prototype.jsx: prospect select, the week hub with the three-week window, the match feed with rare in-match decisions, week/season summaries, and the Team / League / Player / People tabs. The UI must only read engine state and dispatch actions — no game logic in components. Deploy a preview build.

**→ This is your first genuinely playable beta: one career, one season.**

### M3 — Persistence + parallel careers
**Docs:** PROJECT_INSTRUCTIONS.md §3, §5.
> Add save/load with Dexie (IndexedDB): auto-save each week, resume on load, and a save browser. Implement the persistent, ageing shared world and up to five parallel careers the player switches between via the top bar, plus the Career Archive. Careers must survive a reload and continue across multiple seasons (players age on their birth week, decline, and retire).

### M4 — Life system + economy
**Docs:** LIFE_SYSTEM.md, EVENT_LIBRARY.md, DECISIONS_AND_EVENTS.md.
> Implement the off-pitch layer from docs/LIFE_SYSTEM.md: the six 0–100 meters, the layer-2 weighted event scheduler (competition against the QUIET weight, meter-driven modifiers, gates, cooldowns, flags), and the layer-3 weekly life choices. Serialize docs/EVENT_LIBRARY.md into src/engine/data as JSON templates and load them into the scheduler. Implement the finances model: wage + sponsor income, a balance with upkeep, the Finances meter, hard-gated agent tiers, and soft overspending with consequences. Add the UI for life events, choices, and the finances/People screens. Keep everything data-driven and tested.

### M5 — The wider world
**Docs:** PROJECT_INSTRUCTIONS.md §3.
> Expand to the full world from docs/PROJECT_INSTRUCTIONS.md §3: 12 real countries × 2 divisions of 12 clubs, using the tiered simulation (deep = your club + rivals with real players; light = other clubs as strength ratings; shell = the 36 non-playable nations). Implement transfers across clubs and countries, national teams, and the Global National Competition. Keep the deep tier performant; the rest stays abstracted.

### M6 — Polish + beta release
> Add animated key moments (goals, debuts, milestones, status changes), onboarding for a first-time player, and a UX pass on mobile. Run a balancing pass on the tuning constants using headless simulations of many seasons, and flag anything that feels off. Produce a shareable production build and deployment.

**Order note:** you have a playable beta at **M2**; everything after is depth. If you want the off-pitch richness sooner, swap M3 and M4.

## 5. Mobile — Android & iOS

**Short answer: yes, and it's cheap — because the engine is pure TypeScript with no browser dependencies, it ports to any target unchanged. Only the UI layer is web-specific.** Three paths, easiest first:

- **PWA (Progressive Web App)** — make the web app installable to the home screen. Best for the beta.
- **Capacitor (Ionic)** — wraps your *existing* web app in a native shell and produces real Android (.aab) and iOS (.ipa) app-store builds. The easy migration.
- **React Native** — truly native UI with the best feel, but you'd rebuild the UI screens. The engine still ports directly.

**Recommendation:** ship web first, add PWA support during M6, and reach for Capacitor when you want it in the app stores. Keep the engine free of browser/DOM APIs so we can wrap with Capacitor later.

## 6. Working well with Claude Code

- **Small chunks, not "build the game."** One milestone (or sub-task) per session; review and commit before moving on.
- **Use Plan Mode** on M1/M4/M5.
- **Lean on tests.** The engine's math is where bugs hide and where balance lives — keep Vitest green.
- **Tuning is playtesting.** The constants all live in one place for exactly this.
- **Keep CLAUDE.md updated** as decisions land — it's the project's memory across sessions.

---

*The design is done; this is the build path. Start at M0, and you'll have a shareable beta by the end of M2.*
