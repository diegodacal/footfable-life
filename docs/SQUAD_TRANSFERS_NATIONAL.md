# SQUAD, TRANSFERS & NATIONAL TEAM — Design Canon

*Status: draft for review. **Single source of truth** for world structure, squad, transfer, world-persistence and national-team design. Extends `CALENDAR_COMPETITIONS_LOANS.md`, `TRAINING_SYSTEM.md`, `LIFE_SYSTEM.md`. Pure-TS engine, zero React/DOM. Every outcome emits a Reason object.*

## 1. Scope
Covers world structure, transfer windows, AI club economy & buying, player-initiated transfer requests, incoming offers & scouting, roster law, free agency, world persistence & demographics (aging / retirement / youth regen), and merit-based national-team selection with friendlies. **Integrates with — does not replace —** the existing loan system (agent-led + coach-led entry points, playing-time tiers).

**Decisions locked:**
- Key-player transfer-request consequence: **Moderate — real cost, recoverable.**
- National selection: **Pure merit — top-N by ability + form per nation.**
- National friendlies: **occupy weeks already in the calendar** (no new week type).
- World size: **12 main countries × 12 clubs each** (persistent) **+ 20 minnow nations** (national-team only, ephemeral).
- Youth = strictly under 19.

## 2. World structure — nations & clubs
Two tiers of nations.

**Tier 1 — 12 main countries.** Each runs a domestic league of **12 clubs** (consistent with the locked 16-game compact split: an 11-game round robin + a 5-game split). Every club holds a persistent roster (§7 caps) that ages, trades and regenerates across seasons (§9). These nations' teams are picked on merit from this persistent population (§10). Persistent population ≈ 12 × 12 × ≤23 = **≤3,312 players** — small enough to fully simulate on-device; no lazy-loading.

**Tier 2 — 20 minnow nations.** No domestic clubs, no persistent rosters, generally weaker than the 12. They exist **only as national teams and only for the World Cup** (Global National Competition): a one-off squad is generated per tournament at an appropriate (lower) strength and discarded afterward. They take no part in club football, transfers, or the demographic tick.

**World Cup field = 32 nations** (12 main + 20 minnows).

> **Change flag:** earlier canon recorded the Global National Competition at **48** nations. This revises it to **32**. Confirm before wiring.

> **Gate — player nationality:** default assumption is the player belongs to a **Tier-1** nation. If a player may come from a Tier-2 minnow, their national duty would be **World-Cup-only** with a generated squad around them and no inter-tournament friendlies. Confirm whether that path is in scope.

## 3. Transfer windows
Two per 30-week season:
- **Mid-season** — weeks **10–13** inclusive (spans Opening→Split). "January" equivalent.
- **Season-boundary** — weeks **25–30** inclusive (Climax, rolling into next season). "Summer" equivalent.

All permanent transfers and loans **resolve only inside these windows**. Requests may be *lodged* any time but only *complete* in a window. Sole exception: a released player (§8) transacts out of window.

> **Gate — run-in timing:** default = signings allowed across the whole 25–30 window. Optional tunable: restrict *incoming* signings to weeks 28–30 to protect title races.

## 4. Club economy & AI buying
Each Tier-1 club holds an abstract **budget tier** (1..N).
- **Winning raises tier** (weighting: World Club Series > National League > National Cup) plus a cash injection; poor finishes lower it.
- **High tier → proven targets** (high ability + strong form; pays top fees).
- **Low tier → potential targets** (young, high `potential`, low current ability = cheap) or loans.

Each window a club assesses positional depth, picks targets within tier, and to sign must free a slot (sell / loan / release) to respect caps (§7). **The player never influences other clubs' business** — notable moves surface in a **news feed** only.

> **Gate — FINANCES (hard stop):** fees, wages and budget bands stay abstract until the Finances-meter reconciliation lands. Build the *logic* now; wire numbers after.

## 5. Player-initiated requests
Your only levers: **request loan** or **request sale**, via one of two channels.

| Channel | Character | If granted | If refused | Main cost |
|---|---|---|---|---|
| **To the coach** (sporting) | Quiet, relationship-based | Coach arranges a move/loan → feeds existing loan-offer flow with its tiers | Coach may freeze you out → Readiness & selection risk | Coach relationship |
| **To the club** (contractual) | Public, formal | Club sanctions sale/loan; more likely to force an exit if a bid exists | Public rebuff | Reputation & loyalty |

**Consequence scaling (Moderate profile).** Magnitude scales with `importance = f(status ladder, appearances, goal contributions, form)`:
- **Star / Regular + scoring** → a real hit: moderate Reputation/loyalty dip, coach-relationship dip, squad-morale ripple. **Recoverable** — decays over weeks if you stay and perform.
- **Backup / Youth** → near-frictionless.

Importance also sets your **leverage**: the more central you are, the more likely a bid materialises. Every request emits a Reason.

## 6. Incoming offers & scouting
Offers arrive **during windows** (or immediately on release, §8). For each, you can **scout the suitor**: full **10 / 8 / 5** roster with age, ability, form and status per player, plus offer terms — promised role (status ladder / playing-time tier), division & reputation, project fit, wage (abstract). Judge your route to the XI *before* deciding.

**Accept or reject**, both with consequences:
- **Accept** a sale → you move; loyalty at the old club spent, fresh start at the new.
- **Reject** → you stay; repeated rejections can cool the suitor and mildly unsettle your club if the bid was public.

## 7. Roster law
Hard caps per Tier-1 club, always: **≤10 main, ≤8 subs, ≤5 youth** (youth = strictly under 19).
- **Reshuffle buckets** each window: promote youth, demote fringe, rotate main↔sub.
- **Youth age-out:** on turning 19 a youth leaves the bucket — promoted to subs if a slot exists and quality warrants, else loaned or released.
- **Firing/release:** clubs release surplus or underperformers (and, once finances are wired, to cut cost). Mechanical trigger works pre-finances.
- **Signing requires a free slot** — sell / loan / release before or as you buy.

## 8. Free agency (you get released)
If the club releases *you*, you enter **FreeAgent** state and — as a special exception — receive offers **outside the windows**. Offer quality scales to your ability, form and reputation. Reject everything and you stay free (training-only weeks, reduced income once finances are wired) until a suitable offer or the next window. Release dents Reputation/Finances but is recoverable.

## 9. World persistence & demographics
*Applies to **Tier-1 club populations only** — minnows are ephemeral (§2).*

The transfer engine (scouting suitors) and NT selection (all players of a nation) already require every Tier-1 club to hold real players, so the world is fully persistent. A once-a-year **demographic tick** renews squads instead of letting them decay.

**Rollover order** (after week 30, before week 1 of the next year):
1. Competitions settle → club budget tiers update.
2. (Season-boundary transfers already resolved during weeks 25–30.)
3. **Demographic tick** (below).
4. Recompute NT squads.
5. New season begins.

**Demographic tick:**
- **a. Age** +1 for every player.
- **b. Ability update** via the existing age-phase curve (reuse `TRAINING_SYSTEM` phases): youth grow toward potential; veterans decline (physical goes negative).
- **c. Retirements** — probabilistic, rising steeply past ~33–34, hard cap at a max age; low-ability veterans likelier. Retiree leaves club → slot opens. **The player character is exempt from automatic retirement** (their ending is authored — two curated moments) but still ages and declines like everyone else.
- **d. Youth age-out** — a youth turning 19 leaves the youth bucket: promoted to subs if a slot exists and quality warrants, else loaned or released.
- **e. Youth intake / regen** — fill empty youth slots (≤5). New youth age 16–18, low current ability, potential drawn from a distribution scaled by club tier (better clubs → better prospects). **Position-weighted toward the club's thin lines** via a per-club, per-line **gap counter** that increments each season a line is under-strength and raises regen odds there. *(This is the "a position's been open a while, so a youth appears" behaviour.)*
- **f. Viability floor** — after a–e, if any club is below a minimum squad size or missing a line entirely, force-generate youth so it can always field an XI.

Reasons on every demographic event, e.g. *"Retired at 36 after two declining seasons"* / *"Youth intake: 17yo CB — club thin at the back for 3 seasons"* / *"Promoted from youth: turned 19, ability cleared the sub threshold."* All rolls use the seeded RNG; all rates live in `SQUAD_CONFIG`.

## 10. National team
### 10.1 Selection — Tier-1 (pure merit)
Pool = **every player of the nation**, home and abroad.

`selectionScore = 0.7 · abilitŷ + 0.3 · form̂`  *(form = avg match rating over last 5)*

Rank per line, fill positional quotas up to squad size, take the top. **No reputation gate, no home-league bias.** A club substitute is called **only** if genuinely top-N for their nation — which is exactly why a 5.3-form sub won't wear an NT badge under this rule. (A weak player can still make it if their nation is genuinely thin there — realistic.) The player's call-up uses the identical rule.

> **Gate — position taxonomy:** quotas assume **GK / DF / MF / FW** lines; proposed 23-man **3 / 8 / 7 / 5**. Confirm the engine's real position list.

### 10.2 Selection — Tier-2 (generated)
Minnow nations have no persistent pool. For each World Cup, **generate a one-off squad** at a strength band **below the Tier-1 average** (they are the weaker field), then discard it after the tournament. No club-form inputs — strength is synthetic.

### 10.3 Friendlies — on existing weeks
Tier-1 called-up players spend an **already-planned** non-league week on a friendly (no new week type; uniform 30-week calendar preserved). The **national regime** applies — amplified, player-uncontrolled effects, no injury exemption — a lighter version of the World Cup camp model. Declining costs reputation and national standing. Minnows play **no friendlies** (World-Cup-only).

### 10.4 Recompute cadence
Tier-1 squads recomputed before each call-up point (friendlies, tournaments); call-up and drop emit Reasons. Minnow squads are generated at World Cup time only.

## 11. Reason objects (examples)
- **Offer** — "[Club] tier rose after winning [Cup]; targeting your position."
- **Request refused** — "Coach values you as a Regular; move blocked, relationship strained."
- **Sold** — "Club accepted [Club]'s bid during the season-boundary window."
- **Released** — "Surplus at CB after two signings; contract not renewed."
- **Retired / Youth intake / Promoted** — as §9.
- **NT call/drop** — "Called up: 3rd among [Nation] CBs by ability+form" / "Dropped: form fell to 5.4, overtaken by [X]."

## 12. Provisional data shapes (TS)
*(zero React/DOM; illustrative, not final)*
```ts
type Bucket = 'main' | 'sub' | 'youth';
type Status = 'Youth' | 'Backup' | 'Rotation' | 'Regular' | 'Star';
type Line = 'GK' | 'DF' | 'MF' | 'FW';
type PlayingTimeTier = 'GuaranteedStarter' | 'Rotation' | 'EarnYourPlace';
type NationTier = 'main' | 'minnow';

interface Nation {
  id: string; tier: NationTier;
  strength: number;              // minnows: synthetic band below Tier-1 avg
  clubs?: string[];              // main only; minnows have none
}
interface Player {
  id: string; age: number; nationality: string;   // -> Nation.id
  line: Line; ability: number; potential: number;
  formRating: number;            // avg of last N match ratings
  status: Status; bucket: Bucket;
}
interface Club {
  id: string; nation: string;    // always a Tier-1 nation
  budgetTier: number;            // abstract, pending finances
  main: string[]; sub: string[]; youth: string[]; // caps 10/8/5
  gapCounters: Record<Line, number>;              // §9e
}
type RequestType = 'loan' | 'sale';
type RequestChannel = 'coach' | 'club';
interface TransferRequest { type: RequestType; channel: RequestChannel; }
interface Offer {
  fromClub: string; kind: 'permanent' | 'loan';
  role: Status; tier?: PlayingTimeTier;
  reason: Reason;
}
interface Outcome { effects: MeterDelta[]; reason: Reason; }
```

## 13. CONFIG (single data-driven block)
```ts
const SQUAD_CONFIG = {
  world: {
    mainCountries: 12,
    clubsPerCountry: 12,
    minnowNations: 20,
    worldCupField: 32,                    // 12 main + 20 minnows
  },
  windows: { midSeason: [10, 13], seasonBoundary: [25, 30] },
  caps: { main: 10, sub: 8, youth: 5 },
  youthMaxAge: 18,                         // strictly under 19
  selection: {
    wAbility: 0.7, wForm: 0.3, formWindow: 5,
    squadSize: 23, quotas: { GK: 3, DF: 8, MF: 7, FW: 5 },
    minnowStrengthBand: /* below Tier-1 avg */ null,
  },
  demographics: {
    retirementAgeCurve: null,             // steepens past ~33-34
    maxAge: 40,
    regenAgeRange: [16, 18],
    potentialByTier: null,                // better clubs -> better prospects
    gapCounterWeight: null,               // thin-line regen bias
    viabilityFloor: null,                 // min squad / line coverage
  },
  requestConsequence: { profile: 'moderate', decayWeeks: 6 },
  budgetTierBumpOnWin: { worldClubSeries: 3, league: 2, cup: 1 },
};
```

## 14. Stop-and-ask gates
1. **Finances** (hard stop): no fees/wages/budget numbers wired until reconciliation.
2. **Position taxonomy:** confirm real position list (assumed GK/DF/MF/FW, 3/8/7/5).
3. ~~**Population scale**~~ **RESOLVED:** 12 countries × 12 clubs persistent (≤~3.3k players) + 20 ephemeral minnows → full on-device simulation.
4. **Climax-window signing timing:** full 25–30 (default) or restrict incoming to 28–30.
5. **World Cup field size:** confirm the revision from **48 → 32** (12 + 20).
6. **Player from a minnow nation:** in scope? If so, World-Cup-only national duty, generated squad, no friendlies.

## 15. Integration notes
- **Loan system:** a *granted* loan request routes into the existing loan-offer flow (Guaranteed Starter / Rotation / Earn Your Place, division fit, wage split).
- **Calendar:** friendlies overlay existing non-league weeks; caps and windows respect the 30-week / 3-block structure.
- **Meters:** consequences touch Reputation, Morale, Finances, and (via Reputation + Professionalism) derived Character; Family untouched here.
- **Readiness:** coach freeze-out on a refused request feeds the existing Readiness→selection coupling.
- **Demographics scope:** the tick is **Tier-1 only**; minnow squads are generated at World Cup time inside the NT module (§10.2).
