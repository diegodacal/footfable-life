# TRAINING_SYSTEM.md

*Touchline — training & player-development system (redesign).*
*Companion to PROJECT_INSTRUCTIONS.md, PROTOTYPE_SPEC.md, and LIFE_SYSTEM.md. Terms follow the project glossary (readiness, potential, standing; **coach** controls selection, **manager** is your agent).*

---

## 0. Why this redesign exists

The first training model could be **solved once**: pick the split, set intensity, and stop thinking. This version keeps the same lean surface — six attributes, three blocks, an intensity choice — but makes **the right answer change from week to week** by coupling training to state that is already moving in the game. Nothing here adds a new screen; every lever bolts onto a system you've already designed.

**The three live pressures (plus one background cap):**
1. **Readiness × schedule** — pushing hard costs readiness; readiness drives match rating and injury risk. The optimum oscillates against the fixture list.
2. **Coach requests** — periodic focus demands you accept (for standing) or refuse (for freedom). A weekly-changing constraint.
3. **Age phases** — the right training shifts across youth → prime → decline. Training literally cannot be solved once for a whole career.
4. **Diminishing returns** *(background curve)* — each attribute gets stickier as it nears potential, quietly nudging you to spread or switch.

**Deferred to a later layer:** *Breakthroughs / signature traits* (§8) — the aspiration counterweight to all this oscillation. Sketched, not launch-critical.

> **Design rule from the balance desk:** do **not** stack more throttles than these. The life system already showed that overlapping limiters produce dead stretches. Three live pressures + one cap is the ceiling.

---

## 0.5 Implementation reconciliation & decisions (build)

*This section records how the spec below was resolved into code. The engine implementation lives in `src/engine/systems/{training,development,injuries,coachRequest}.ts`; every tunable lives in `src/engine/data/trainingConfig.ts` (the §10 config).*

- **Attributes — the canonical EIGHT, not the illustrative six (§1 / §12-Q1).** The §1 table is illustrative and drops two canonical attributes. The implemented set is the canonical eight from PROTOTYPE_SPEC §4: Technical{**Finishing, Passing, Control**}, Physical{**Pace, Strength, Stamina**}, Mental{**Composure, Positioning**}. Blocks are therefore **3 / 3 / 2**, not two each; the per-attribute formulas are count-agnostic. No names were invented.
- **Decline reconciliation (§4 vs §6/§9, §12-Q4).** The literal §4 formula multiplies the whole gain by `agePhaseMult`, which is negative for Physical in decline — taken literally that makes hammering Physical decay it *fastest*, the opposite of §6/§9's "Intensive physical only slows decay". Resolved by modelling decline as a **natural age decay that training partially offsets**: net Physical change in decline is always ≤ 0, but Intensive/primary focus makes the drop smaller than neglect (never positive). Adds two config knobs — `growth.declineOffsetStrength` and `growth.declineOffsetCap` — no magic numbers.
- **§12 open questions:**
  - **Q1 (attribute names)** → canonical eight (above).
  - **Q2 (third-block maintenance)** → small maintenance weight `focusWeight.maintenance = 0.10` so the third block isn't totally neglected; set it to `0` to make the third block simply "hold".
  - **Q3 (coach-request granularity)** → **block-level**. The `CoachRequest` model carries an optional `attribute` field so attribute-level requests can be added later without a rewrite.
  - **Q4 (decline decay)** → training slows decay (above); physicals drift down on their own, and Intensive/primary only reduces the rate.
  - **Q5 (readiness start / season reset)** → `readiness.start = 70` (FRESH); a pre-season top-up `readiness.seasonReset = 80` on season rollover.
  - **Q6 (facility modifier)** → present as `growth.facilityMod = 1.0` (neutral at launch; a later depth layer).
- **§8 (breakthroughs / signature traits)** → deferred, not built. Architecture left open.
- **"Why" trace.** Every training week, readiness state change, and coach request emits a structured `Reason` (see the engine-level Reason contract), rendered as the §9 readout.

---

## 1. Attributes & blocks

Six attributes, two per block. **Canonical names live in PROTOTYPE_SPEC.md** — the names below are illustrative for the formulas; reconcile before implementation. *(Build note: reconciled to the canonical **eight** — see §0.5.)*

| Block | Attribute A (illustrative) | Attribute B (illustrative) |
|---|---|---|
| **Technical** | Finishing | Passing |
| **Physical** | Pace | Stamina |
| **Mental** | Composure | Positioning |

Each attribute has a **current** value and a hidden **potential** (shown as a hint/range per prior decision, never an exact number).

---

## 2. The weekly training choice

Each week the player sets two things:

- **Focus** — a **primary block** (70% of training weight) and a **secondary block** (30%). The third block gets residual maintenance weight only.
- **Intensity** — `Intensive`, `Balanced`, or `Recover`, applied to the whole week.

That's the entire input surface. All depth below comes from how these interact with readiness, the coach, and age.

---

## 3. Readiness × schedule (pressure 1)

**Readiness `R` ∈ [0, 100].** It is the hinge of the whole system.

### 3.1 Weekly readiness update
```
R_next = clamp(
    R
    + RECOVERY_BASE                       # natural weekly rest
    − trainingCost(intensity)             # cost of this week's work
    − matchCost(minutesPlayed),           # cost of last week's match
    0, 100
)
```
| Intensity | `trainingCost` | growth multiplier `gMult` |
|---|---|---|
| Intensive | `COST_INTENSIVE` (high) | `1.0` |
| Balanced | `COST_BALANCED` (low) | `0.6` |
| Recover | `0` (adds `RECOVER_BONUS`) | `0.15` |

`matchCost(minutes)` scales with minutes: a 90' start drains far more than a late sub cameo (ties to the explicit substitute-entry timing already in the match feed).

### 3.2 Readiness → performance (band-based, not linear)
A band model gives a clear safe zone and a clear danger zone (legibility over a smooth curve):

| Readiness band | Match-rating modifier |
|---|---|
| `PEAK` (≥ 80) | `+PEAK_BONUS` (small) |
| `FRESH` (50–79) | `0` (no penalty) |
| `TIRED` (30–49) | `−TIRED_PENALTY` |
| `DEPLETED` (< 30) | `−DEPLETED_PENALTY` (large) |

### 3.3 Readiness → injury risk
```
p_injury = INJURY_BASE + INJURY_SLOPE × max(0, INJURY_THRESHOLD − R)
```
Below `INJURY_THRESHOLD`, risk climbs the more depleted you are. Intensive weeks apply a further `INJURY_INTENSIVE_MULT`.

**The resulting decision loop:** Intensive is the best growth, but entering a big fixture under-recovered means a rating penalty *and* raised injury risk. So the player reads the **three-week schedule window** and modulates: push in a light week, ease off before a heavy one. The schedule is already on screen — this makes it matter.

---

## 4. Attribute growth

Per attribute, per week:
```
gain = BASE_GAIN
     × gMult(intensity)          # §3.1
     × focusWeight(block)        # 0.70 primary / 0.30 secondary / MAINT third
     × agePhaseMult(block, age)  # §6  — can be negative in decline
     × diminishing(current, potential)   # §5
     × facilityMod               # optional club/facility multiplier, default 1.0
```
`gMult × focusWeight × agePhaseMult` is where week-to-week variety lives. Growth is **surfaced to the player** each week as a short "why" line (see §9), consistent with the engine-level Reason requirement.

*(Build note §0.5: when `agePhaseMult < 0` the code does not use this product directly — it applies a natural decay that training offsets, so Intensive only slows the drop.)*

---

## 5. Diminishing returns (the background cap)

```
diminishing(current, potential) =
    clamp( (potential − current) / DR_SCALE , DR_FLOOR , 1.0 )
```
As `current → potential`, the term collapses toward `DR_FLOOR`, so grinding a near-maxed attribute stops paying and the player naturally re-spreads. Quiet, always-on, no UI of its own.

---

## 6. Age phases (pressure 3)

`agePhaseMult` is **per-block**, not global — that's what makes it structural rather than a flat slowdown. Age advances via season-week birthdays (per prior decision).

| Phase | Age (illustrative) | Technical | Physical | Mental |
|---|---|---|---|---|
| **Youth** | ≤ 21 | `1.3` | `1.3` | `1.0` |
| **Prime** | 22–29 | `1.0` | `0.7` | `1.1` |
| **Decline** | ≥ 30 | `0.6` | **`−0.4`** | `1.0` |

The negative physical multiplier in decline means even **Intensive physical training only *slows* decay** — you're fighting to hold the line, not grow. Technical stays stable, mental can still climb. A career therefore has a natural arc: build broadly young, peak and specialize in prime, defend the body and lean on the mind late. **No single training plan is correct for a whole career.**

---

## 7. Coach requests (pressure 2)

The **coach** (selection authority, distinct from your manager) periodically asks you to focus your training — e.g. *"Sharpen your finishing before the derby"* or *"You're fading late — work stamina."* Generation is gated so it stays occasional.

### 7.1 Generation
A request may fire when, subject to `REQUEST_COOLDOWN` and a per-season cap:
- a **notable fixture** is inside the schedule window, **or**
- your **role/status** implies a gap (e.g. a Backup pushing for Rotation), **or**
- recent performance flags a weakness the coach cares about.

### 7.2 Resolution — a real trade-off
| Player choice | Effect during window | On window close |
|---|---|---|
| **Accept** | Focus is partly constrained to the coach's block/attribute | If it paid off (target rose or performances improved) → **+STANDING_BONUS** and coach trust in you rises |
| **Refuse** | You keep full control of your development | **−STANDING_PENALTY**; repeated refusals risk morale/relationship friction and can bias selection against you |

This is the *"my growth vs. my playing time"* tension, and because it's tied to fixtures and role it **changes across the season**. Standing feeds the existing merit-based selection system.

---

## 8. Breakthroughs / signature traits *(deferred layer)*

The counterweight: sustained commitment should occasionally pay off big, or the oscillation above never lets the player *invest*.

**Sketch (not launch-critical):** accumulating focus-weeks on one attribute/theme past a threshold arms a low-probability **breakthrough roll**; success unlocks a **signature trait** (e.g. *Dead-Ball Specialist*, *Clinical Finisher*) that grants a situational bonus. Rewards the player who ignores short-term optimization to chase mastery. **Full spec deferred** — parked here so nothing else forecloses it.

---

## 9. What training surfaces to the player (the "why")

Consistent with the engine-level Reason requirement (no outcome without an explanation), each week training reports a compact, plain-language readout:

- **Gains:** *"Finishing +0.4 — Intensive, primary focus, still well below potential."*
- **Stalls:** *"Passing +0.0 — near your potential; further work yields little."*
- **Readiness:** *"Readiness 41 (Tired) — a −rating penalty and raised injury risk if you start Saturday."*
- **Decline:** *"Pace −0.2 — age is working against you here; Intensive is only slowing the drop."*

The player should never be surprised by a gain, a stall, or a drop.

---

## 10. Data-driven config (all tunables in one place)

Everything above is data, not code, so the redesign lands as tuning — not a rewrite. Illustrative shape *(the built config, `src/engine/data/trainingConfig.ts`, enumerates all **eight** attributes and adds `declineOffsetStrength`/`declineOffsetCap`, `readiness.start`/`seasonReset`, and the coach-request trigger knobs)*:

```json
{
  "attributes": [
    { "id": "finishing",   "block": "technical" },
    { "id": "passing",     "block": "technical" },
    { "id": "control",     "block": "technical" },
    { "id": "pace",        "block": "physical"  },
    { "id": "strength",    "block": "physical"  },
    { "id": "stamina",     "block": "physical"  },
    { "id": "composure",   "block": "mental"    },
    { "id": "positioning", "block": "mental"    }
  ],
  "intensity": {
    "intensive": { "trainingCost": 22, "gMult": 1.0,  "injuryMult": 1.6 },
    "balanced":  { "trainingCost": 10, "gMult": 0.6,  "injuryMult": 1.0 },
    "recover":   { "trainingCost": 0,  "gMult": 0.15, "recoverBonus": 12 }
  },
  "focusWeight": { "primary": 0.70, "secondary": 0.30, "maintenance": 0.10 },
  "readiness": {
    "start": 70, "seasonReset": 80,
    "recoveryBase": 14, "matchCostPer90": 20,
    "bands": { "peak": 80, "fresh": 50, "tired": 30 },
    "ratingMod": { "peakBonus": 0.3, "tiredPenalty": -0.8, "depletedPenalty": -1.8 }
  },
  "injury": { "base": 0.02, "slope": 0.004, "threshold": 40 },
  "agePhase": {
    "youth":   { "maxAge": 21, "technical": 1.3, "physical": 1.3,  "mental": 1.0 },
    "prime":   { "maxAge": 29, "technical": 1.0, "physical": 0.7,  "mental": 1.1 },
    "decline": { "maxAge": 999, "technical": 0.6, "physical": -0.4, "mental": 1.0 }
  },
  "growth": { "baseGain": 0.6, "drScale": 20, "drFloor": 0.05, "facilityMod": 1.0,
              "declineOffsetStrength": 1.0, "declineOffsetCap": 0.85 },
  "coachRequest": {
    "cooldownWeeks": 4, "seasonCap": 6,
    "standingBonus": 8, "standingPenalty": 5, "windowWeeks": 3, "triggerChance": 0.4
  }
}
```
*(All numbers are starting guesses for playtesting, not balanced values.)*

---

## 11. Build notes

- Pure engine math, no DOM — ports with the rest of the engine (Capacitor-ready).
- Training growth and every readiness state change emit a **Reason** (§9), same contract as selection/events.
- Ships single-career like everything else; the model is per-Career and indifferent to how many Careers exist.
- Keep §8 (breakthroughs) out of the first playable — validate the oscillation loop first.

---

## 12. Open questions

*(All resolved for the build — see §0.5.)*

1. **Confirm the canonical six attribute names** against PROTOTYPE_SPEC.md and replace the illustrative set. → **Resolved: the canonical EIGHT.**
2. **Third-block maintenance weight** — is `0.10` enough to prevent total neglect, or should the third block simply hold (no growth, no decay)? → **Resolved: `0.10` (config; set `0` to hold).**
3. **Coach-request granularity** — request a whole *block*, or a single *attribute*? → **Resolved: block (attribute field reserved).**
4. **Decline decay without training** — should physicals drift down on their own even in Balanced/Recover, or only relative to Intensive? → **Resolved: natural decay that training offsets; Intensive only slows it.**
5. **Readiness starting value** and how a new season resets it. → **Resolved: start 70, season reset 80.**
6. **Facility/club modifier** — in for launch, or a later depth layer? → **Resolved: present but neutral (1.0).**
