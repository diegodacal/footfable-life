# PERSONAL_LIFE_TAB.md

*Touchline — the Personal Life tab (off-pitch home screen).*
*Companion to LIFE_SYSTEM.md (owns meter mechanics & the dependency engine), TRAINING_SYSTEM.md, and PROJECT_INSTRUCTIONS.md. Terms follow the project glossary. This doc specs the **surface and the tie-together**, plus one new derived read (Character, §4). It does not re-specify the dependency engine.*

---

## 0. Decision on record & why this exists

**Decided in playtest (Savio, screens 1–4):** the player screen splits into two tabs — **Career** and **Personal Life** — each with simple tap interactions. The Amir Bauer card is the Career side (identity, season stats, attributes). This doc specs the Personal Life side: the home for meters, money, family, weekly life choices, and off-pitch drama.

**The design tension to hold:** Savio's own framing — *"simple like Elifoot, but diversified absurdly."* The surface must stay one-tap legible; the **depth comes from breadth of authored events, not from a denser UI.** Every screen here is scannable at a glance and every action is 1–2 taps.

---

## 1. Tab structure

One player screen, two tabs, swipe or tap between them. Both are per-Career (indifferent to how many careers exist — single-career at launch).

| **Career tab** *(existing)* | **Personal Life tab** *(this doc)* |
|---|---|
| Identity: name, position, club | Life status read (§2) |
| Age, Status, Current ability, Potential | The six life meters (§3) |
| Season stats (apps/mins/goals/assists/form) | Character read (§4) |
| Attributes | Finances panel (§5) |
| Readiness (on-pitch consequence) | Family & relationships (§6) |
| | Weekly life choices (§7) + Life inbox (§8) |

---

## 2. Life status (the one-line read)

At the top, a single plain-language summary of off-pitch life, derived from the meters — the equivalent of the Career card's Status line. Examples: *Settled · Living large · Stretched thin · In trouble.* One tap expands to the meters below. This is the "glance" layer; it must never require interpretation.

---

## 3. The six life meters

Home for the meters defined in LIFE_SYSTEM.md: **Professionalism, Lifestyle, Morale, Reputation, Finances, Family** (each 0–100). Displayed as six compact bars with band colouring (e.g. healthy / watch / danger).

- **Tap a meter → recent movers.** A short list of what pushed it this week/last, each with direction and cause — the same **Reason** contract as selection and training. *"Morale −6: skipped family time twice; lost the derby."* The player is never surprised by a meter move.
- Meters are **read-and-cause only here.** They are *moved* by life choices (§7), events (§8), and on-pitch results — not edited directly.

---

## 4. Character — a derived read, **not** a seventh meter *(new, per Savio)*

Savio's idea: a good-character player gets wholesome opportunities (marry a good partner); a bad-character player gets shady ones (sell out to a betting company). Excellent as a **narrative lens** — but per the balance desk, we do **not** add a seventh stored meter. Character is *derived* from meters you already track plus history flags the dependency engine already stores.

### 4.1 Derivation
```
Character C =
    0.40 × Reputation
  + 0.40 × Professionalism
  + 0.20 × historyBalance        # normalized 0–100 from existing choice flags
```
`historyBalance` maps the running tally of *conduct* flags (virtuous choices vs. reckless ones) already recorded by the dependency engine into 0–100. This makes Character feel like **accumulated conduct**, not an instantaneous stat, while adding zero new stored state.

### 4.2 Display & bands
Shown as a labelled spectrum with a marker (tap → what's pulling it):

| Band | `C` | Flavour | Event effect |
|---|---|---|---|
| **Model Pro** | ≥ 70 | Clean, dependable | Weights up wholesome/prestige events; reputable sponsors court you |
| **Grounded** | 40–69 | Ordinary | Mixed pool |
| **Loose Cannon** | < 40 | Reckless, exposed | Weights up shady events: betting-company approaches, bad-influence crowd, scandal risk |

### 4.3 How it gates events
Character does **not** invent a new system. It supplies a **weight multiplier** to authored events inside the existing weighted-competition engine — a wholesome event carries `characterBias: high`, a shady one `characterBias: low`, and the current band scales its odds. That's the whole hook.

---

## 5. Finances panel — the consequence economy

Money is important, not central. This panel makes overspending *bite* (the chain you and Savio both landed on: blow it on nightlife → a kid appears → support payments → broke → game over).

### 5.1 What's shown
A concrete **Balance** (money) with a compact weekly ledger — the number the **Finances meter** summarizes.
```
Weekly balance change =
  + wages
  + sponsor income
  − manager's cut          # your agent's tier; see §5.3
  − lifestyle upkeep       # scales with Lifestyle meter — living large costs more
  − obligations            # debt service, child support if applicable (§6)
```

### 5.2 The debt → fail chain (telegraphed, never sudden)
1. **Balance < 0 →** you enter **Debt**; it accrues interest.
2. Debt drags the **Finances meter** down → periodic **Morale** hits → **money-trouble events** fire more often (all surfaced with a Reason).
3. Sustained, unserviceable debt → a clearly warned **broke** cliff → this is a legitimate **hard-fail** end for the career (per prior decisions). Warnings escalate first; the player always sees it coming.

### 5.3 Agent tiers (hard-gated by affordability)
Local / Established / Elite — the tier you can hire is **hard-gated** by whether you can sustain the cut. No hiring an Elite agent you can't afford. This ties the Finances panel to the manager (agent), distinct from the coach.

---

## 6. Family & relationships

Home of the **Family** meter.

- **Partner status & relationship health** — moved by family-time choices, events, and neglect.
- **Dependents (the consequence hook).** A reckless nightlife path can trigger a child event → the **DNA-test dilemma** (an authored event) → if confirmed, a recurring **child-support obligation** (§5.1) plus lasting Family/Finances effects. Savio's exact example, wired to the money chain.
- **Family time** as a weekly choice (§7): lifts Family & Morale but spends your discretionary slot — a real opportunity cost against rest or training focus.

---

## 7. Weekly life choices (the tap layer)

The simple interactions Savio asked for — and the **pacing guard** he warned we need.

- **Categories:** Celebrate · Night out · Purchase · Family time · Self-care/Recover · Media/Appearance.
- **Flow:** 1 tap to pick → a **consequence preview** (the meter/money deltas, shown *before* you commit — this is the "why" up front) → confirm. Two taps, never a menu dive.
- **Pacing cap:** a small number of discretionary actions per week (start at **2**), with per-category cooldowns and season caps (reuse the LIFE_SYSTEM throttles). This directly answers Savio's *"o jogo pode acabar em 1 noite"* — you cannot binge a whole life in one sitting.

---

## 8. Life inbox — where authored drama surfaces

Reactive events (§4-gated) land here as tappable cards, each with a Reason ("why this is happening to you now") and 1-tap choices.

**Seed events from Savio's playtest** (fold into EVENT_LIBRARY.md):
- *You're invited to a party full of models, but there's a big match tomorrow — go or decline?*
- *A woman requests a DNA test.*
- *A flash car is within reach — buy it?*
- *A locker-room fight breaks out — break it up or throw a punch?*
- *(Loose Cannon only) A betting company offers a shady endorsement.*

**Interrupt rule:** most events wait politely in the inbox; only **high-stakes** ones (match-eve dilemmas, scandal) interrupt globally. Keeps the surface calm.

---

## 9. Pacing & chapter breaks *(responsibility + feel)*

Beyond the weekly cap, the tab respects natural **stop points** — season end, transfer window, off-season — as clean places to put the game down rather than dangling one-more-week forever. Better pacing *and* the responsible call, straight from Savio's binge warning. The Personal Life tab should never behave like a slot machine.

---

## 10. Parked (future home, not launch scope)

Cosmetic identity — kits, boots, tucked-in/out shirts, name changes — is real retention juice and Savio's right that people love it. The Personal Life tab is its natural future home, but it stays **off the launch critical path** (roadmap-later, per the earlier call). **Monetization stays off-table:** a shady betting *sponsor* is great in-fiction drama (§8), never a real revenue hook.

---

## 11. Build notes

- Pure engine state; the tab is a view over LIFE_SYSTEM data. No DOM in the engine.
- **Character (§4) is computed, never stored** — derive on read from meters + existing history flags.
- Every meter move, money change, and event emits a **Reason** (same contract as selection/training).
- Per-Career; ships single-career like everything else.
- Consequence-preview (§7) reuses the same Reason projection, run forward on the candidate choice.

---

## 12. Open questions — resolved in the M4 build

1. **Finances meter vs. Balance** — **RESOLVED: shock + drift.** Balance is the
   concrete ledger; the Fin meter is shocked by event `Fin` deltas AND drifts
   weekly toward a Balance/debt-derived security target. Tiers map to € via
   `economyConfig.moneyUnit`. (See LIFE_SYSTEM.md "Implemented".)
2. **Character weights & thresholds** (§4) — shipped at the specced **0.40/0.40/
   0.20** blend and **70/40** band cuts (`lifeConfig.character`); tune in playtest.
3. **Weekly discretionary cap** (§7) — **2/week** (`lifeConfig.weeklyChoiceCap`),
   plus per-choice cooldowns and season caps. A flagged assumption; one knob to
   revisit.
4. **Interrupt threshold** (§8) — **match-eve dilemmas** (any `matchWithinDays`
   gate) and the **catastrophes** (`evt_dna_test`, `evt_scandal_leak`,
   `evt_betting_deal`, `evt_child_confirmed`) interrupt; everything else waits
   calmly in the inbox (`lifeConfig.interrupt`).
5. **Split navigation** — **segmented toggle** Career ↔ Personal Life inside the
   existing Player bottom-nav tab (`store.playerView`); the bottom nav is
   unchanged. A Hub banner deep-links when an interrupt is waiting.
6. **Dependents** — **one at launch**; child support is a recurring obligation
   (`child_support` / `child_support_min`) that runs to career end. Multiple
   dependents and variable-duration support are future work.

*Character is computed, never stored (`deriveCharacter`); Finances is the only
meter with an independent (economy-owned) driver. Everything else is per-Career
and data-driven.*
