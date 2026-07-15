# Off-Pitch Life System

> Design for the priority-two off-pitch layer. It has three layers: (1) the **life meters** — the state everything reads from and writes to; (2) the **dependency engine** — how meters weight which events fire; (3) the **two-way coupling** with the on-pitch game. This doc starts with layer 1 (the meters) and will grow. Companion to PROJECT_INSTRUCTIONS.md and DECISIONS_AND_EVENTS.md.

---

## The six meters

All run **0–100**. A young prospect starts grounded, with room to rise or fall. Each meter lists what raises it, what lowers it, and what it *affects* (its coupling). Meters drift slowly toward a baseline if nothing acts on them.

### 1. Professionalism — work ethic, discipline, conduct
- **Up:** training consistently, honoring coach requests, clean conduct, maturity with age.
- **Down:** a heavy Lifestyle, refusing the coach, disciplinary incidents, scandals.
- **Affects:** a small multiplier on **development**, **coach standing**, and slight injury resistance; **lowers the odds of disciplinary/scandal events**. High professionalism blunts Lifestyle's downsides.
- **Start ~60.**

### 2. Lifestyle — how much you go out and take off-pitch risks
- **Up:** nights out, a celebrity social life, big spending; **fame raises temptation** (success pulls this up).
- **Down:** staying in, focusing, quiet spells, a strong Family grounding you.
- **Affects:** a short-term **Morale** boost, but erodes **Professionalism**, **Readiness**, and **Finances** over time — and it's **the key driver of risky life events** (scandals, paternity claims, incidents). High Lifestyle = more drama, good stories and bad.
- **Start ~30.**

### 3. Morale — happiness, motivation, mental state
- **Up:** playing regularly, winning, good form, life balance, a stable Family, positive events.
- **Down:** benching, losing, injuries, poor form, life or family crises, a soured agent relationship.
- **Affects:** **match performance** (form/rating) and **development**; low morale makes you more likely to want out, sulk, or refuse. The tightest on-pitch coupling.
- **Start ~65.**

### 4. Reputation — public image, how the world sees you
- **Up:** strong performances, handling media well, community/charity, loyalty, big moments, national-team success.
- **Down:** scandals, poor conduct, bad media handling, mercenary moves.
- **Affects:** **sponsor offers**, **transfer interest**, and fan/media treatment; slight sway on board/coach perception. Reputation is what sponsors and clubs are really buying.
- **Start ~20** (an unknown youngster).

### 5. Finances — financial security
- **Up:** wages, sponsor income, prudent choices, good contracts.
- **Down:** big spending (tied to Lifestyle), bad money advice from a poor agent, weak deals, scandal costs.
- **Affects:** **pressure** — low finances stress Morale and raise the odds of chasing money over the right move; high finances buy the freedom to choose well. Sits on top of the economy system (which tracks actual cash beneath it).
- **Start ~40.**

### 6. Family — family & relationship stability and support
- **Up:** giving time and attention (a trade-off against training and nightlife), stability, handling milestones well.
- **Down:** neglect (all-football *or* all-nightlife), crises, scandals, relocation stress from transfers.
- **Affects:** **buffers Morale** (stable family steadies you; a strained one drags you down), **dampens Lifestyle risk**, and gates family-specific events (a new partner, children, crises).
- **Start ~70.**

## How they interconnect (preview of the dependency engine — layer 2)

The meters aren't independent — most events read several at once:
- **Lifestyle ↑** pushes Professionalism, Family, and Finances **down**, Morale **up short-term**, and event-risk **up**.
- **Professionalism ↑** raises development and coach standing, and **suppresses** risky events.
- **Morale** trades both ways with the on-pitch game (form, selection).
- **Reputation ↔ Finances** through sponsors; **Reputation ↔ career** through transfers.
- **Family ↑** cushions Morale and pulls Lifestyle risk down.

This web is exactly what layer 2 formalizes: each event's odds = base rate × modifiers from these meters (e.g., a paternity claim is common at high Lifestyle + low Family, near-impossible at the opposite).

## Coupling to the on-pitch game (preview — layer 3)

- **Off-pitch → on-pitch:** Morale and Professionalism feed development and match ratings; Reputation opens transfers and sponsorships; Finances shape which moves you can afford to turn down.
- **On-pitch → off-pitch:** success and fame raise Lifestyle temptation and Reputation; benching and losing drain Morale; a big-money move lifts Finances but can strain Family.

## Layer 2 — The Dependency Engine

This is how the meters (plus on-pitch state and history flags) decide **which life event fires each week**. The goal: events feel earned and personal, big life events stay rare, and one choice quietly reshapes what happens next.

### The core model: weighted competition + a "quiet" default

Each event template computes a **weight** from the current state. Every week the scheduler also adds a large **QUIET** weight (meaning "nothing happens"), then does a single weighted-random pick. Because QUIET dominates, most weeks are calm; an event only surfaces when its weight climbs high enough to compete.

```
weight(event) = base × Π(modifiers) × Π(flagMods)      // 0 if any hard gate fails
P(this event) = weight(event) / (QUIET + Σ all eligible weights)
```

Starting knobs (all tunable): **QUIET ≈ 45**, event **base ≈ 0.5–1.5**. With eligible weights typically summing to a few, that puts the chance of *any* life event around **5–12% per week** — a handful across a ~27-week season. Big events sit at the low end; lighter ones higher.

### The modifier vocabulary

Events express dependencies with a small, data-friendly set of terms:

- **`gate(condition)`** — hard eligibility. Fails → weight 0. (e.g. `Lifestyle ≥ 40`.)
- **`scales_with(Meter)`** — multiplier rises with the meter: `0.25 + 2.25 × (M/100)` → 0.25 at 0, ~1.4 at 50, 2.5 at 100.
- **`scales_inverse(Meter)`** — the same, driven by `(100 − M)`: high when the meter is low.
- **`flag(Name, ×mult)`** — history flags nudge odds (e.g. `settled_partner ×0.3`, `has_scandal ×1.5`).
- **`cooldown(weeks)`** and **`maxPerSeason(n)`** — stop repeats and runaway drama.

Curves are deliberately simple so the whole event set is **authorable as data**, not code.

### The weekly scheduler

1. Gather every event whose **gates** pass and whose **cooldown** is clear and **season cap** not hit.
2. Compute each one's **weight** from base × modifiers × flag mods.
3. Add the **QUIET** weight.
4. **Weighted-random pick one.** (At most one *big* life event per week; routine choices from layer 3 run separately.)
5. If a real event is picked, present it. On resolution, apply its option's **consequences** (meter writes + flags) and set its cooldown.

### Worked example — the paternity claim

```
event: paternity_claim
  base: 0.8
  gate: Lifestyle ≥ 40
  mods: scales_with(Lifestyle), scales_inverse(Family)
  flags: settled_partner ×0.3, has_children ×0.6
  cooldown: 60 weeks (rare)
```
- **High-lifestyle, low-family, single** (Lifestyle 80, Family 30): `0.8 × 2.05 × 1.83 ≈ 3.0`. Against QUIET 45 → ~6% that week — an occasional bombshell.
- **Grounded homebody** (Lifestyle 25): gate fails → **weight 0**. It simply never happens.
- **Settled family player** (Lifestyle 50, Family 80, settled_partner): `0.8 × 1.38 × 0.70 × 0.3 ≈ 0.23` → practically nil.

Same event, wildly different lives — exactly your dependency idea, made numeric.

### More quick examples

- **Tabloid scandal** — `base 0.7; scales_with(Lifestyle); scales_inverse(Professionalism); flag has_scandal ×1.4` (drama begets drama).
- **Morale slump** — `base 0.9; gate(recent minutes low OR poor form); scales_inverse(Morale)` — reads *on-pitch* state, not just life meters.
- **Sponsor approach** — `base 0.6; scales_with(Reputation); gate(Reputation ≥ 35)` — opportunity, not trouble.

### The feedback loop (why chains emerge)

Each resolution **writes back** to meters and sets flags:
- Handle a scandal badly → Reputation ↓, `has_scandal` set → future scandals *more* likely and sponsor odds *lower*.
- Go public and own a paternity claim → Reputation dip now, but Family may recover; deny it → bigger Reputation risk if it resurfaces.
- A settled relationship sets `settled_partner`, which suppresses the very events that threaten it.

Nothing is hard-scripted — the chains fall out of meters feeding weights feeding consequences feeding meters.

### Data shape (for the Claude Code build)

```json
{
  "id": "paternity_claim",
  "channel": "life",
  "base": 0.8,
  "gates": ["Lifestyle>=40"],
  "modifiers": [
    {"type":"scales_with","meter":"Lifestyle"},
    {"type":"scales_inverse","meter":"Family"}
  ],
  "flagMods": {"settled_partner":0.3,"has_children":0.6},
  "cooldown": 60, "maxPerSeason": 1,
  "options": [
    {"label":"Handle it privately","effects":{"Finances":-10,"Family":-5}},
    {"label":"Go public","effects":{"Reputation":-8,"Morale":-4,"flags":["public_paternity"]}},
    {"label":"Deny everything","effects":{"flags":["risky_denial"],"Reputation":-3}}
  ]
}
```

### Tuning knobs
QUIET weight (overall rarity), per-event base, the modifier curve endpoints, cooldowns and season caps, and how hard consequences hit the meters.

## Layer 3 — Weekly Life Choices

Where layer-2 events *happen to you*, layer-3 choices are ones you **make**. They're few and weighty (the pacing pillar), they move the six meters, and **most of them cost money** — which is what gives the Finances meter and the spending model below their bite. At most one life choice competes for a week (alongside the layer-2 roll), so they stay special.

They surface three ways: **triggered** (a milestone prompts a celebration), **invited** (the lads are going out), or **player-initiated** (you decide to buy something, or give family time). The main ones:

- **Celebration** — *trigger: a milestone (first goal, hat-trick, trophy, call-up).* How do you mark it?
  - **Fancy club (€€€)** — Morale ++, Lifestyle ++, Reputation +, big spend, raises night-out incident risk.
  - **Nice night out (€€)** — Morale +, Lifestyle +, moderate spend.
  - **Low-key with family (€)** — Morale +, Family +, small spend.
  - **Stay professional** — Professionalism +, small Morale, no spend.
- **Night out** — *invited, weighted by Lifestyle + teammate chemistry.* Go big (€€) / Go modest (€) / Decline (Professionalism +).
- **Lifestyle purchase** — car, watch, home. Tiers €→€€€, each with **ongoing upkeep** (a recurring commitment). Reputation/Morale/Lifestyle up; Finances down.
- **Family time** — invest a week's attention → Family ++, Morale +; opportunity cost (less nightlife/extra training). Little money cost.
- **Media & community** — interview or charity/appearance → Reputation +; small time/money cost.
- **Look after yourself** — rest, diet, recovery → Professionalism +, Readiness +.

## Finances & Spending

Finances is both a **meter** (layer 1, "how secure am I") and a real **budget** underneath it. That budget is what makes the choices above matter.

- **Income:** a **wage** (club level × status × contract) plus **sponsor income** (driven by Reputation). Grows as your career does.
- **Balance:** savings that rise by income − spending − **upkeep** (purchases add recurring costs).
- **Finances meter = security:** a function of your buffer versus your commitments. A healthy cushion sits high; a thin or negative one sits low, dragging Morale and opening **money-trouble events** (layer 2).

**Two affordability rules** — the heart of your point:

1. **Hard-gated: you can't hire beyond your means.** Agents (and later, other services) come in **tiers** — *Local · Established · Elite* — with visible **reach** (Elite unlocks bigger clubs and sponsors) but **hidden reliability within any tier**. Cost scales with tier (a wage cut and/or fee). You can only sign a tier your income supports, so **you can't just hire the best-connected agent** — you grow into them. Reliability is still a gamble at every tier.
2. **Soft: you *can* overspend — and pay for it.** Discretionary spending (parties, purchases) is never blocked, but each option shows a **€/€€/€€€** cost and whether it's *comfortable* or *a stretch*. Splurge past your means and the balance goes negative → **debt, a Finances crash, a Morale hit, and money-trouble events**. The fancy-club celebration is exactly this: great for Morale now, a problem later if you couldn't afford it.

**The loop:** overspending → low Finances → stress and money events; rising income → afford better agents, better lifestyle, and the freedom to pick the *right* move instead of the richest one.

## Implemented (M4) — and reconciliations on record

All three layers are built and wired into the weekly tick (see CLAUDE.md for the
code map). Notes where the build resolved an open design point:

- **Layer 1 (meters).** Live on `player.meters`; `systems/lifeMeters.ts` runs the
  weekly drift-toward-baseline + the coupling web. `applyMeterEffects` is the
  SINGLE writer and always emits a `Reason` — no meter moves without a "why".
  Tunables: `data/lifeConfig.ts` (`drift`, `coupling`).
- **Layer 2 (dependency engine).** `systems/events.ts` runs the QUIET competition
  over `events.json`. The `weight = base × Π(modifiers)` model is realized as
  `weightBase × characterMultiplier(bias, band) × Π(weightMods) × Π(flagWeightMods)`
  — the **meter-derived modifier is the Character band** (itself Rep+Prof+conduct),
  with the classic `scales_with`/`scales_inverse` vocabulary folded in as optional
  `weightMods` for later authoring. Gates, cooldowns, season caps, annual recurs,
  chains (flags + followups), and tallies→status-flags (3/4/2) all honored.
- **Layer 3 (weekly choices).** `lifeConfig.choices`, applied via
  `makeLifeChoice`, capped at **2/week** with per-choice cooldowns; the UI shows a
  forward-projected `Reason` (consequence preview) before commit.
- **FINANCES RECONCILIATION (resolved).** The abstract money tiers and the 0–100
  Fin meter are reconciled as **shock + drift**: a concrete **Balance** is the
  ledger (`+wages +sponsors −agent cut −upkeep −obligations`); event `Fin` deltas
  shock the meter immediately; each week the meter also drifts toward a
  Balance/debt-derived security target. Tiers map to **€** via `moneyUnit`
  (small 1→€25k … huge 20→€500k) in `data/economyConfig.ts`. Debt → telegraphed
  Morale hits → a **broke** hard-fail. (This answers PERSONAL_LIFE_TAB §12.1.)

## Still to design (next)

- **More event variety** (the library is 71 events; a 30-year arc wants 200–400),
  the national-team tournament arc, and the old-library channels not yet ported
  (agent advice, transfer negotiation, sponsor obligations, coach change).
- **Tuning:** meter drift/coupling weights, the QUIET weight, wage/sponsor/upkeep
  numbers, agent-tier costs, and how hard consequences hit — all in
  `lifeConfig.ts` / `economyConfig.ts`.



---

*Six meters, all 0–100, grounded starting values. Adjust any meter, its drivers, or its effects — this is the foundation the events and dependencies will build on.*
