# Event & Choice Library (v1)

> The authored set of events, choices, and match-day decisions, written in the layer-2/3 data shape from LIFE_SYSTEM.md. Human-readable and directly serializable to JSON for the Claude Code build. This is a **starting library** — add, cut, and re-weight freely. Companion to DECISIONS_AND_EVENTS.md (concepts) and LIFE_SYSTEM.md (the engine).

> **SCHEMA RECONCILIATION (M4 — on record).** The canonical, runtime event content
> is now **`src/engine/data/events.json`**, built + validated by
> `scripts/build_events.py` (schema in EVENT_LIBRARY_EXPANSION.md + EVENT_CHAINS.md).
> Extend events by editing the builder, never by hand. This v1 doc is **design
> rationale**, kept for its channel coverage. Diff vs. the canonical shape:
> `type/trigger/mods(scales_with/scales_inverse)/flags×mult/limit/options.effects`
> here → `trigger/gates/weightBase/characterBias/effects{meters(short codes)/money/
> tally/flags/modifiers/followups}` there. The classic **weight vocabulary is
> folded** into the canonical schema as optional `weightMods`/`flagWeightMods`, so
> these events CAN be ported without a rewrite. Channels here not yet in
> `events.json` — **match-day decisions** (already native, `MatchDecision`),
> **agent advice**, **transfer negotiation**, **sponsor obligations**, **coach
> change/dressing-room** — are **deferred authoring**, not silently dropped.

---

## How to read an entry

```
### id — Title
type:      event (happens to you) | choice (you initiate) | matchday (in-match) | career
trigger:   base N  · or  milestone:X  · or  in-match:X   (how it becomes eligible)
gates:     hard conditions; all must pass or weight = 0
mods:      weight multipliers from meters — scales_with(M) / scales_inverse(M)
flags:     flag ×mult  (history nudges)
limit:     cooldown W weeks · cap N/season
options:   Label → effects
```

**Effect vocabulary.** Meters (0–100): Professionalism, Lifestyle, Morale, Reputation, Finances, Family. Money: `€` cost tiers (small/med/large) or income. `+flag name` sets a history flag. On-pitch: Dev (development), Readiness, Standing (coach). Match-day options resolve via an **attribute check** with success/fail effects.

**Global knobs (tune):** QUIET ≈ 45 (the "nothing happens" weight it all competes against); a `scales_with(M)` term = `0.25 + 2.25·(M/100)`; `scales_inverse` uses `(100−M)`.

---

## A. Match-day decisions
*Resolved by an attribute check, not weighted. ~20% of matches carry one; 0–1 per match.*

### take_penalty — Step up for the penalty?
type: matchday · trigger: in-match, penalty won while on the pitch
resolve: Composure + Finishing vs. keeper
options:
- Take it → success: goal, Morale +6, Reputation +3 · fail: miss, Morale −6, Rating −
- Leave it to a senior → neutral, no risk

### shoot_or_pass — Half-chance on the edge
type: matchday · trigger: in-match, shooting chance
resolve: Finishing (shoot) vs. a better-placed teammate
options:
- Shoot → success: goal · fail: wasted chance, Rating −
- Square it → success: assist · fail: nothing

### hard_tackle — Dive into the 50/50?
type: matchday · trigger: in-match, loose ball, booking risk
resolve: Positioning + Strength; modified by Professionalism (discipline)
options:
- Go for it → success: win the ball, Rating + · fail: booking, or injury risk
- Stay on your feet → safe, no gain

### react_provocation — An opponent winds you up
type: matchday · trigger: in-match, after a foul
resolve: Composure; low Professionalism raises the odds of losing it
options:
- Rise above it → Reputation +2, Standing +1
- Bite back → risk a card, Reputation −4, +flag hot_head

### chase_lost_cause — Chase the ball that's surely gone?
type: matchday · trigger: in-match, late, losing
resolve: Stamina; effort read by fans/coach
options:
- Chase it down → Morale +3, Standing +2, Readiness −
- Let it go → neutral, but a quiet Standing − if repeated

---

## B. Agent advice
*Agent-driven. Fires a few times a season if you have an agent. The agent recommends one option; their pick is correct with probability = their hidden reliability. After the outcome you mark Trust/Distrust, which moves the relationship (and how much they help). Built in the POC.*

### advice_training_focus — Neglecting part of your game
type: event · trigger: base 1.0 (agent) · gates: has_agent
mods: — · limit: cooldown 4
options: Switch focus / Stick with current → good: Dev +, productive block · bad: wasted weeks

### advice_rest — "You're overdoing it"
type: event · trigger: base 0.9 (agent) · gates: has_agent
options: Ease off (good if Readiness low) / Keep grinding (good if fresh) → Readiness or Dev; wrong call costs Readiness

### advice_sponsor_day — A boot brand wants a promo
type: event · trigger: base 0.8 (agent) · gates: has_agent, Reputation≥25
options: Do it (good if fresh) → €income, Reputation + / Decline (good if tired) → Readiness kept

### advice_transfer_timing — A bigger club circles
type: event · trigger: base 0.6 (agent) · gates: has_agent, Reputation≥45
options: Push the move (good if Regular+) / Stay & prove it (good if lower) → career step or setback

### advice_media — Front up to the press?
type: event · trigger: base 0.7 (agent) · gates: has_agent, after a rough patch
options: Do the interview (good if Form ok) / Head down → Reputation ±

### advice_contract — Your deal is running down
type: event · trigger: base 0.7 (agent) · gates: has_agent, contract<1yr
options: Sign / Hold out / Run it down → Finances, security, or free-agent gamble

---

## C. Career & transfers

### transfer_offer — A club makes a move
type: career · trigger: base 0.9 · gates: Reputation≥40 · mods: scales_with(Reputation), scales_with(Morale-inverse when unhappy)
flags: unsettled ×1.5 · limit: cooldown 8
options:
- Accept the move → new club (level ↑), Finances +, Family − (relocation), expectations ↑
- Negotiate → chance of better terms, small delay
- Reject, stay loyal → Reputation +3, +flag one_club_love, Standing +

### loan_offer — Go out for minutes *(in POC)*
type: career · trigger: event when young + low minutes · gates: has_agent, status∈{Youth,Backup}, minutesShare<0.15
limit: cap 1/season
options: Take the loan → guaranteed minutes, Dev + / Stay & fight → keep competing

### contract_talks — Renewal on the table
type: career · trigger: base 0.5 · gates: contract<1.5yr, Standing≥40
options: Sign (Finances +, security) / Push for more (board relationship risk) / Delay

### release_risk — Told you may be let go
type: event · trigger: base 0.8 · gates: status=Youth, minutesShare≈0, age≥18 · mods: scales_inverse(Standing)
options: Knuckle down (Professionalism +, small comeback chance) / Seek a move → drop divisions or wash-out risk (hard-fail path)

### national_callup — Your country calls
type: career · trigger: base 0.7 · gates: strong club form, eligible · mods: scales_with(Reputation)
options: Accept (default) → Reputation ++, market value +, minutes load +, injury/fatigue risk +

---

## D. Off-pitch life — events (happen to you)

### paternity_claim — Someone comes forward
type: event · trigger: base 0.8 · gates: Lifestyle≥40 · mods: scales_with(Lifestyle), scales_inverse(Family)
flags: settled_partner ×0.3, has_children ×0.6 · limit: cooldown 60, cap 1
options:
- Handle privately → Finances −large, Family −5
- Go public & own it → Reputation −8, Morale −4, +flag public_paternity
- Deny everything → Reputation −3, +flag risky_denial (resurfaces worse later)

### tabloid_scandal — A story breaks
type: event · trigger: base 0.7 · gates: Lifestyle≥35 · mods: scales_with(Lifestyle), scales_inverse(Professionalism)
flags: has_scandal ×1.4 · limit: cooldown 30
options:
- Apologise & move on → Reputation −5, Professionalism +2
- Ignore it → Reputation −8, +flag has_scandal
- Blame the press → gamble: Reputation +4 or −10

### nightlife_incident — A night out goes wrong
type: event · trigger: base 0.6 · gates: recent_night_out flag · mods: scales_with(Lifestyle)
options: Front up / Cover it up → Professionalism, Reputation, Standing effects; injury risk

### breakup — A relationship ends
type: event · trigger: base 0.5 · gates: has_partner · mods: scales_inverse(Family), scales_with(Lifestyle)
options: Throw yourself into football (Morale −, then Dev +) / Take time (Morale recovers, Readiness −)

### family_situation — Family needs you
type: event · trigger: base 0.5 · mods: scales_inverse(Family)
options: Fly home / drop everything → Family +, Morale +, miss a match · Stay & focus → Family −, guilt (Morale −)

### morale_slump — You're not feeling it
type: event · trigger: base 0.9 · gates: minutesShare low OR poor form · mods: scales_inverse(Morale)
options: Talk to the coach (Standing insight) / Push through / Ask your agent about a move (+flag unsettled)

### gambling_temptation — An easy-money offer
type: event · trigger: base 0.4 · gates: Finances<35 · mods: scales_inverse(Finances), scales_with(Lifestyle)
options: Walk away (Professionalism +) / Take the bait → Finances swing + or big Reputation/legal risk

### viral_moment — Something good goes viral
type: event · trigger: base 0.5 · gates: after a standout game · mods: scales_with(Reputation)
options: Lean in (Reputation ++, sponsor odds ↑) / Stay humble (Reputation +, Professionalism +)

---

## E. Off-pitch life — choices (you initiate)

### celebration — Mark the moment
type: choice · trigger: milestone (first goal, hat-trick, trophy, call-up) · limit: per milestone
options:
- Fancy club (€€€) → Morale ++, Lifestyle ++, Reputation +, +flag recent_night_out, incident risk ↑
- Nice night out (€€) → Morale +, Lifestyle +
- Low-key with family (€) → Morale +, Family +
- Stay professional (free) → Professionalism +, small Morale

### night_out — The lads are going out
type: choice · trigger: base 0.7 (invite) · mods: scales_with(Lifestyle) · flags: good_chemistry ×1.3
options: Go big (€€) → Morale +, Lifestyle +, Readiness −, +recent_night_out / Go modest (€) / Decline → Professionalism +

### lifestyle_purchase — Treat yourself
type: choice · trigger: player-initiated (menu) · gates: none (soft overspend allowed)
options (tiers): Watch (€) / Car (€€) / House (€€€) → Reputation +, Morale +, Lifestyle +, Finances −, adds upkeep; overspend → debt + Morale −

### family_time — Invest in home life
type: choice · trigger: player-initiated / periodic · cost: time (opportunity)
options: Spend the week with family → Family ++, Morale +, less training/nightlife this week

### charity_appearance — Give something back
type: choice · trigger: base 0.4 · mods: scales_with(Reputation)
options: Do it (€ small) → Reputation +, +flag good_egg / Skip

### media_interview — A sit-down is offered
type: choice · trigger: base 0.5 · after notable games
options: Do it (good if Form/Reputation ok) → Reputation ± / Decline → neutral, small mystique

### self_care — Look after yourself
type: choice · trigger: player-initiated · options: Rest & recovery → Readiness +, Professionalism + / (opportunity cost vs. other choices)

---

## F. Sponsors & commercial

### sponsor_offer — A brand comes calling
type: choice · trigger: base 0.6 · gates: Reputation≥35 · mods: scales_with(Reputation) · tiers by Reputation
options: Accept → €€ income, image obligations, +flag has_sponsor / Negotiate / Decline → keep focus

### sponsor_obligation — Your deal needs you
type: event · trigger: base 0.5 · gates: has_sponsor
options: Do the appearance (€ time) → keep the deal / Skip → deal at risk, Finances −, Reputation −

### endorsement_scandal — A brand drops you
type: event · trigger: base 0.4 · gates: has_sponsor, has_scandal
options: (mostly consequence) → Finances −, Reputation − — a downstream sting from earlier choices

---

## G. Agent & services (money-gated)

### hire_agent — Sign an agent
type: choice · trigger: player-initiated · gates: affordability by tier
tiers (visible reach, hidden reliability, cost scales):
- Local (€) → small reach: lower-league clubs, minor sponsors
- Established (€€) → mid reach
- Elite (€€€) → big clubs & sponsors; only affordable once your income supports it
options: Sign [tier] → sets agent (fresh hidden reliability), trust 65 / Go without → Dev much slower

### fire_agent — Part ways
type: choice · trigger: player-initiated · gates: has_agent
options: Part ways → no agent (Dev slows) until you sign another

---

## H. Coach & club

### coach_training_request — The coach wants a focus
type: event · trigger: periodic · gates: has_coach
options: Accept → that program primary this week, Standing + / Refuse → your focus, Standing −

### coach_change — A new coach arrives
type: event · trigger: periodic (board/results driven)
options: (consequence) → Standing resets with the new coach; role may shift; a fresh reads-you-or-not gamble

### dressing_room_issue — A rift in the squad
type: event · trigger: base 0.4 · mods: scales_inverse(chemistry)
options: Take a side / Stay out / Mediate → chemistry, Standing, Reputation effects

---

## Coverage & next steps

Channels covered: match-day, agent advice, career/transfers, off-pitch events, off-pitch choices, sponsors, agent/services (money-gated), coach/club. Missing by design (to add): national-team **tournament** arc detail, **retirement/decline** events for older careers, and more life variety.

**For the build:** serialize each entry to the JSON shape in LIFE_SYSTEM.md; wire effects to the six meters + money + flags + on-pitch; run them through the layer-2 scheduler. Then tune weights, costs, and effect sizes in play.

---

*v1 — a working library, not a finished one. Every entry is a template to expand, re-weight, or cut.*
