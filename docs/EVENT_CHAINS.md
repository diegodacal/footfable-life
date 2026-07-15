# EVENT_CHAINS.md

*Touchline — compounding chains & archetype paths.*
*Extends EVENT_LIBRARY.md / EVENT_LIBRARY_EXPANSION.md. Consumes the dependency engine (LIFE_SYSTEM.md), Character (PERSONAL_LIFE_TAB.md §4), and training age/breakthrough curves (TRAINING_SYSTEM.md §6, §8).*

---

## 1. The principle: compound both directions, solve neither

The existing library punishes recklessness through chains (`parties_hard → dna_test → child_support → broke`). This doc adds the mirror — **discipline and good choices compound into payoffs the reckless player can never reach** — while keeping the game unsolved.

**The design guard (critical):** if "be disciplined" were strictly best, the game becomes *always pick the boring option*. So this is **not virtue vs. vice.** It's **two viable identities**, each compounding, each with a distinct reward curve and a distinct way to fail:

| | **Consummate Pro** | **Magnetic Maverick** |
|---|---|---|
| Builds from | declining temptation, saving, loyalty | indulging, swagger, big spending |
| Compounds into | better training, prestige sponsors, longevity, respected legacy | fame, bold brands, global-icon ceiling |
| Sponsor pool | clean image (watches, elite kit) | bold image (energy, streetwear, nightlife) |
| Failure mode | a *duller, lower-ceiling* career; "robotic" media angle; less joy | the crash — scandal, DNA, broke |
| Opportunity cost | lower Morale/Lifestyle highs; capped fame | volatility; live catastrophe chains |

A player threading the Maverick needle without crashing becomes a bigger star than any Pro. A Pro trades that ceiling for security and a graceful decline. **Both are winning strategies; neither dominates.**

---

## 2. Mechanic: tallies → status flags → gated chains

Chains build from **choice tallies** the engine already tracks (it stores history flags; counting flags of a type is trivial — no new state model). Crossing a threshold awards a **status flag** that gates the payoff events.

| Tally (from repeated choices) | Threshold | Status flag | Gates |
|---|---|---|---|
| `pro_points` | ≥ 3 | `pro_track` | premium sponsors, graceful ageing |
| `maverick_points` | ≥ 4 (and no major scandal) | `icon_track` | bold brands, global icon |
| `loyalty_points` | ≥ 2 (+5yrs) | `one_club_man` | testimonial+, club role |
| `family_points` | ≥ 3 | `family_anchor` | slump resilience |
| `wealth_points` | ≥ 3 (no bad_investment) | `financially_secure` | wise investment, empire |
| `leader_points` | ≥ 3 | `natural_leader` | dressing-room control, coaching |

Tallies are **mutually reachable** — a career can be a loyal family-man Pro, or a maverick who's also a natural leader. They layer.

---

## 3. CHAIN A — The Consummate Pro *(your example, made the spine)*

### A1 — the granular seed (recurring, high-frequency)
```json
{
  "id": "evt_early_night",
  "title": "Early Night",
  "category": "life:nightlife",
  "stages": ["youth","break","prime"],
  "trigger": "reactive",
  "characterBias": "neutral",
  "gates": { "matchWithinDays": 2 },
  "cooldownWeeks": 3,
  "prompt": "The lads are heading out. There's a match in two days.",
  "choices": [
    { "label": "Skip it, get your rest", "effects": { "Rdy": 5, "Prof": 3, "Mor": -3, "tally": "pro_points+1", "flag": ["turned_down_temptation"] }, "reason": "Rested and sharp for the weekend; a little FOMO. Discipline is quietly banking toward something bigger." },
    { "label": "Go out with them", "effects": { "Rdy": -10, "Mor": 6, "Life": 5, "Prof": -3, "tally": "maverick_points+1", "flag": ["parties_hard"] }, "reason": "Fun tonight, heavy legs Saturday — and it starts a different story." }
  ]
}
```

### A2 — discipline pays into training *(the "evolve better" payoff)*
```json
{
  "id": "evt_pro_noticed",
  "title": "The Staff Notice",
  "category": "career",
  "stages": ["break","prime"],
  "trigger": "threshold",
  "gates": { "tallyAtLeast": { "pro_points": 3 } },
  "prompt": "The fitness coach pulls you aside: your professionalism is setting the standard. The staff are taking note.",
  "choices": [
    { "label": "Keep it up", "effects": { "Std": 6, "Prof": 4, "trainingBonus": "readiness_edge + breakthrough_chance_up", "flag": ["pro_track"] }, "reason": "Your recovery habits mean training lands harder — a standing edge and a better shot at a signature breakthrough (TRAINING_SYSTEM §8). This door is shut to party players." }
  ]
}
```
*This is your idea, mechanized: declining nights out → `pro_points` → a real training-evolution edge the maverick literally cannot earn.*

### A3 — prestige sponsors *(the "better sponsors" payoff, with the lockout)*
```json
{
  "id": "evt_premium_sponsor",
  "title": "A Prestige Approach",
  "category": "life:finance",
  "stages": ["prime"],
  "trigger": "conditional",
  "characterBias": "high",
  "gates": {
    "requiresFlag": "pro_track",
    "forbidsAnyFlag": ["parties_hard", "betting_ties", "hothead"],
    "minReputation": 45
  },
  "prompt": "A luxury watch house wants a clean-image ambassador. The kind of deal that only goes to players without baggage.",
  "choices": [
    { "label": "Sign — represent the brand", "effects": { "Fin": 20, "Rep": 8, "Character": "+", "flag": ["prestige_sponsor", "conduct_clause"] }, "reason": "Serious, stable money and prestige. A conduct clause means a future scandal would cost you — but you don't do scandals." },
    { "label": "Hold out for the right fit", "effects": { "Rep": 3 }, "reason": "Selective — protects your value." }
  ]
}
```
*`forbidsAnyFlag` is the lockout you described: the party player carries `parties_hard`, so this offer never appears for them.*

### A4 — long-term compounding
> **`evt_brand_ambassador` — The Long Deal** · *prime, vet* · *life:finance* · high · `requiresFlag:prestige_sponsor, tenure>=3yr`
> The brand wants you as their face for the long haul.
> - **Commit** → Fin +recurring, Rep +, flag[secure_income]; *compounds toward a secure post-career (feeds CHAIN E).*

### A5 — the decline payoff
> **`evt_ageing_gracefully` — The Body Keeps Its Promises** · *vet, twilight* · *career:health* · neutral · `requiresFlag:pro_track, lifetimeProfHigh`
> All those disciplined years show. Your body is holding up far better than your peers'.
> - **Play on, sharp and smart** → decline curve softened (physical decay reduced, TRAINING_SYSTEM §6), Rdy +, Std +; *years the maverick's body won't give him.*

**Pro's built-in cost:** `pro_points` choices repeatedly cost Morale/Lifestyle highs, and a `low_profile` media flag accumulates — capping fame and locking off the icon ceiling (CHAIN B). Some teammate-bond events gate on *not* being aloof. Discipline is not free.

---

## 4. CHAIN B — The Magnetic Maverick *(high risk, high ceiling)*

The reckless choices don't only lead to ruin — if you *don't* crash, charisma compounds into stardom the Pro can't touch.

> **`evt_icon_rising` — Box Office** · *break, prime* · *life:reputation* · low · `tallyAtLeast:{maverick_points:4}, forbidsAnyFlag:[major_scandal, broke]`
> Your flair and personality are turning you into box office. The camera loves you.
> - **Lean into the persona** → Rep +12, Fin +, flag[icon_track]; *a star is born — if you can stay upright.* **(Fame is carried by the Reputation meter — no separate value; see §11.4.)*

> **`evt_lifestyle_brand` — The Bold Deal** · *prime* · *life:finance* · low · `requiresFlag:icon_track`
> An energy-drink giant wants your rockstar image — bigger reach than any watch deal, but it lives or dies on you staying *hot*.
> - **Sign the mega-deal** → Fin +huge, Rep +/−volatile, flag[volatile_income]; *massive upside, tied to relevance — a slump hurts the wallet too.*

> **`evt_global_icon` — Bigger Than Football** · *prime* · *life:reputation* · low · `requiresFlag:icon_track, minReputation:75`
> You've transcended the sport. Fashion, film cameos, the works.
> - **Embrace global celebrity** → Rep +huge, Fin +, exposure flag; *the ceiling the Pro never reaches — and the scandal chains are still live under you.*

**Maverick's built-in cost:** every `maverick_points` choice also arms a catastrophe (`parties_hard`, `betting_ties`, `big_spender`). The icon path is a tightrope: thread it and you're a legend; slip and you're `evt_scandal_leak → dna_test → finances_reckoning`.

---

## 5. CHAIN C — One-Club Legend

> **`evt_stay_loyal` — Repay the Faith** *(the loyal branch of `evt_loyalty_transfer`)* → `loyalty_points+1`, flag[loyal].
> **`evt_club_icon` — Their Favorite Son** · *prime, vet* · *life:reputation* · high · `tallyAtLeast:{loyalty_points:2}, years>=5`
> A generation of fans has only ever known you in this shirt.
> - **You're a club icon** → Rep +14, Std +8, flag[one_club_man]; *a standing floor here; a statue in waiting.*
> **`evt_club_ambassador` — A Home For Life** · *post* · *career* · high · `requiresFlag:one_club_man`
> The club offers you a permanent role — coaching, ambassador, whatever you want.
> - **Come home** → guaranteed post-career role, Mor +, Fin +stable; *belonging the mercenary traded away.*

**Cost:** every loyal choice turned down a bigger payday — lifetime Finances runs lower than the mover's, and a quiet `what_if` flag can surface a "could you have won more elsewhere?" reflection.

---

## 6. CHAIN D — Family Anchor

> **`evt_family_anchor` — Something Solid** · *prime* · *life:family* · high · `tallyAtLeast:{family_points:3}`
> Between the partner, the marriage, and the kids, you've built something that holds.
> - **This is your foundation** → flag[family_anchor], Mor floor set; *a resilience the lonely player lacks.*
> **`evt_slump_resilience` — They've Got You** · *conditional* · *life:family* · high · `requiresFlag:family_anchor, triggeredBy:[bad_form, long_injury]`
> The football is going badly. But you go home to people who don't care about your rating.
> - **Draw strength from them** → Mor recovers +12, flag[weathered_it]; *the party player free-falls here; you don't.*
> **`evt_grounded_retirement` — The Second Act** · *post* · *life:family* · high · `requiresFlag:family_anchor`
> Retirement isn't a cliff for you — it's more time with the people who matter.
> - **Step into it happily** → Mor +14; *a soft landing.*

**Cost:** family-time choices repeatedly spend the weekly discretionary slot (PERSONAL_LIFE_TAB §7) and compete with training focus. A recurring `career_vs_family` tension event forces real trade-offs.

---

## 7. CHAIN E — Financial Dynasty

> Builds from `saver`, passed `crypto_pitch`, modest purchases → `wealth_points`.
> **`evt_wise_investment` — A Real Opportunity** · *prime, vet* · *life:finance* · high · `tallyAtLeast:{wealth_points:3}, forbidsFlag:bad_investment`
> A vetted, genuine opportunity — the kind only shown to people with capital *and* a track record of not blowing it.
> - **Invest wisely** → Fin +compounding, flag[smart_money]; *money making money.*
> **`evt_business_empire` — Life After, Sorted** · *post* · *life:finance* · high · `requiresFlag:smart_money`
> Your ventures are thriving. Football was the start, not the whole story.
> - **Run your empire** → Fin +huge stable, Mor +, flag[secure_legacy]; *the exact inverse of `evt_finances_reckoning → broke`.*

**Cost:** years of `saver`/modest choices meant lower Lifestyle and Morale peaks — you watched the `big_spender` have the flash and the fun while you waited.

---

## 8. CHAIN F — Respected Leader

> Builds from `peacemaker`, `captaincy`, `mentor` → `leader_points`.
> **`evt_natural_leader` — The Dressing Room's Voice** · *prime, vet* · *career:relationships* · high · `tallyAtLeast:{leader_points:3}`
> When it's tense, the room looks to you.
> - **Own the role** → flag[natural_leader]; dressing-room conflict events now resolve in your favor; coach-standing floor. *(Ties CHAIN F to smoother selection.)*
> **`evt_coaching_destiny` — The Obvious Path** · *vet* · *career* · high · `requiresFlag:natural_leader, coach_track`
> Everyone can see you'll manage one day.
> - **Prepare seriously** → flag[manager_ready]; *sets up the payoff.*
> **`evt_successful_manager` — The Next Chapter** · *post* · *career* · high · `requiresFlag:manager_ready`
> Your management career takes off.
> - **Build a legacy from the dugout** → Rep +huge, Fin +, Mor +; *football's second life.*

**Cost:** leadership responsibility periodically dents your *own* form (a `carrying_the_team` event trades your rating for the group's), and it eats time.

---

## 9. Standalone "good" events *(quiet rewards, not chains)*

Because kindness shouldn't always be strategic:

> **`evt_hospital_visit` — No Cameras** · *any* · *life:reputation* · high
> You quietly visit a children's ward. No press invited.
> - **Just be there** → Character +, Mor +8, flag[good_heart]; *it leaks anyway, and people love it more for the fact you didn't publicize it.*
> - **Bring the press** → Rep +6, Character neutral; *good, but it reads as PR.*

> **`evt_struggling_teammate` — A Hand Up** · *any* · *career:relationships* · high
> A younger teammate is drowning — form gone, confidence shot.
> - **Take time to help him** → Std +5, `leader_points+1`, Character +; *your own week is busier, but he turns a corner.*

> **`evt_relegation_loyalty` — Stay and Fight** · *prime* · *career* · high · `clubRelegated`
> The club that made you just went down. Bigger clubs are circling.
> - **Stay and bring them back up** → Rep +14, `loyalty_points+1`, Character +, flag[folk_hero]; *legend status, at a sporting cost.*
> - **Take the escape route** → Fin +, Rep −6; *understandable, unloved.*

> **`evt_lost_wallet` — Small Thing, Big Story** · *any* · *life:reputation* · high · `characterBand:!LooseCannon`
> You return a fan's dropped wallet, cash untouched. Someone filmed it.
> - **Think nothing of it** → Rep +8, Character +, Mor +4; *a feel-good moment goes around the world.*

---

## 9b. Reinvention arc *(archetype flip — resolved)*

A career that goes hard one way, then flips, earns a dedicated pivot (not just the sum of both). Both are threshold events keyed on the *opposite* tally accumulating after a status flag is already set.

> **`evt_reinvention_reform` — The Turning Point** · *prime, vet* · *life:reputation* · `requiresAnyFlag:[parties_hard, icon_track, big_spender], tallyAtLeast:{pro_points:2}`
> The wild years are behind you; word spreads that you've genuinely changed.
> - **Own the redemption story** → Rep +, Prof +, Mor +, Character +, flag[reinvented, redemption_arc]; *the public loves a reformed maverick — reopens the Pro doors even with old baggage.*
> - **Let your football do the talking** → Prof +, flag[reinvented]; *quiet reform.*

> **`evt_reinvention_unleashed` — Off the Leash** · *prime, vet* · *life:lifestyle* · `requiresFlag:pro_track, tallyAtLeast:{maverick_points:2}`
> A lifetime of being the model pro, and something wants to finally cut loose.
> - **Reinvent as a free spirit** → Mor +, Life +, Rep +, Prof −, flag[reinvented, late_bloomer]; *a livelier final act — new fans, new brands.*
> - **Stay the course** → Prof +; *not who you are.*

## 9c. Reflection beats *(resolved — mechanical + two endings)*

Cost flags (`what_if`, `low_profile`) stay **purely mechanical** during play — no real-time editorializing. Exactly **two** curated reflection events surface them, and only at career's end, so they read as emergent story rather than nagging.

> **`evt_reflection_whatif`** · *twilight, post* · `requiresFlag:one_club_man + retired` — the loyal one-club man wonders what he'd have won elsewhere. (No-regrets → Mor+/Character+; sit with it → small Mor−, an honest ache.)
> **`evt_reflection_lowprofile`** · *twilight, post* · `requiresFlag:low_profile + retired` — the quiet craftsman who was never a headline takes pride in twenty years of professionalism. (Mor+/Prof+/Character+.)

---

## 10. Balance & pacing notes

- **Symmetry check:** for every catastrophe chain there is now a compounding-reward chain of comparable length. The library rewards mastery in *both* directions.
- **No dominant path:** each positive chain carries an explicit opportunity cost (§3–§8); the Pro/Maverick table (§1) is the top-level guarantee that neither identity strictly wins.
- **Tallies stay invisible-ish:** don't show raw `pro_points`. Surface progress through *flavor* — the "staff notice," the "box office" beat — so it feels earned, not grinded. (Reconcile with the "should chains show their history?" open question in EVENT_LIBRARY_EXPANSION §9.)
- **Threshold events are milestones:** they should feel like a career turning a corner, and land at most a couple per season, respecting the §7 weekly cap.

---

## 11. Resolved decisions *(all now realized in `events.json`)*

1. **Tally thresholds** — kept at **3/4/2** (`config.tallyThresholds`); revisit only in playtest.
2. **Archetype blending** — a flip earns a **reinvention arc** (§9b): `reform` and `unleashed`.
3. **Maverick catastrophe rate** — **very rare**; the DNA/scandal/betting triggers carry low `weightBase` (0.25–0.5) and `config.catastropheRate = "very_rare"`.
4. **Fame** — **tied to the Reputation meter**, no separate value; the global-icon tier gates on `Rep ≥ 75`. (`fameCeiling` removed.)
5. **Reflection beats** — **mechanical by default + two ending-only beats** (§9c).

*Still genuinely open (shared with PERSONAL_LIFE_TAB §12 / events.json meta):* the `money` tiers and the `Fin` meter need reconciling with the finances model.
