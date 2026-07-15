# EVENT_LIBRARY_EXPANSION.md

*Touchline — authored event expansion for a full ~30-year career arc.*
*Merges into EVENT_LIBRARY.md. Consumes the dependency engine (LIFE_SYSTEM.md), the Character read (PERSONAL_LIFE_TAB.md §4), and the age phases (TRAINING_SYSTEM.md §6). Reconcile the schema below with the canonical one in EVENT_LIBRARY.md before import.*

---

## 1. Design intent

A career runs ~30 years (youth → post-retirement), so the library must be **broad, not deep-per-event** — Savio's *"simple like Elifoot, diversified absurdly."* Every event is one prompt + a few one-tap choices; variety comes from **volume, life-stage gating, and the culture/climate layer**, not from complex UI.

**Even-handedness rule for cultural content:** events key on the *individual* (origin, faith flag, climate background, current location, history flags), never on a national stereotype. Faith events are faith-*general* and adapt to the player's own faith. Institutional facts (e.g. conscription, pilgrimage) are portrayed neutrally and factually. No culture is caricatured; each gets texture, not a punchline.

---

## 2. Schema (compact)

Full JSON for exemplars (§4, §7); the rest use this 1:1 shorthand:

> **`evt_id` — Title** · *stages* · *category* · charBias · `gates`
> Prompt.
> - **Choice** → effects; *reason*

**Meters:** Prof (Professionalism), Life (Lifestyle), Mor (Morale), Rep (Reputation), Fin (Finances), Fam (Family). **Also:** Rdy (readiness), Std (coach standing), flag (history flag set). **charBias:** high / neutral / low (weights the event by Character band). **stages:** Youth 16–18 · Break 18–22 · Prime 22–29 · Vet 30–33 · Twilight 33–36 · Post 36+.

---

## 3. Player cultural profile (the framework)

Attached to each footballer at creation; drives §7 gating without hardcoding nations.

```json
{
  "origin": "morocco",
  "climateOrigin": "hot",            // hot | temperate | cold
  "faith": "muslim",                 // muslim | christian | none | other  (observance flag separate)
  "observant": true,                 // player may set/drift; gates faith events
  "familyExpectation": "high",       // send-money-home / big-family pull
  "homeContinent": "africa"
}
```
Plus **current location** (club country) supplies `climateNow` and `season` so climate events compare *origin vs. now*.

### 3.1 Country profile table (illustrative texture, not stereotype)
| Country | climate | faith texture | football flavor |
|---|---|---|---|
| Brazil | hot-humid | mixed Christian | street/futsal, joga bonito, Carnival |
| Argentina | temperate | mixed Christian | passionate press, fierce fandom |
| Spain | temperate (hot summers) | Christian/secular | possession culture, regional identity |
| France | temperate | secular/diverse | diverse roots, tactical schooling |
| Morocco | hot-arid | Muslim-majority | community-central, Ramadan/Hajj |
| South Africa | warm | Christian/mixed | community, local-hero pressure |
| Nigeria | hot | Christian/Muslim mix | big-family, faith-central |
| Japan | temperate | secular/Shinto-Buddhist | discipline, collective duty |
| China | temperate | secular | rising league money, family duty |
| South Korea | temperate | mixed | discipline, **military-service** institution |
| Mexico | warm | Catholic-majority | family/faith, passionate liga |
| *(others via shell nations)* | — | — | — |

*Palestine and all origins share the universal "far-from-home / family / pride" events (§6); no origin is given political content — the game stays about the person.*

---

## 4. Seed dilemmas (Savio's five) — full JSON exemplars

```json
{
  "id": "evt_model_party",
  "title": "The Model Party",
  "category": "life:nightlife",
  "stages": ["break", "prime"],
  "trigger": "reactive",
  "characterBias": "low",
  "gates": { "minLifestyle": 40, "matchWithinDays": 2 },
  "cooldownWeeks": 8, "seasonCap": 2,
  "prompt": "You're on the list for a party packed with models tonight — but there's a big match tomorrow.",
  "choices": [
    { "label": "Go — you only live once", "effects": { "Rdy": -18, "Mor": 6, "Life": 8, "Prof": -6, "flag": ["parties_hard"] }, "reason": "Late night before a fixture; readiness and professionalism take the hit." },
    { "label": "Decline, rest up", "effects": { "Prof": 5, "Rdy": 3, "Mor": -2, "flag": ["turned_down_temptation"] }, "reason": "Pro choice; small morale dip for missing the fun." },
    { "label": "Go, but leave early", "effects": { "Rdy": -7, "Mor": 3, "Prof": -1 }, "reason": "A compromise — some cost, some fun." }
  ]
}
```
```json
{
  "id": "evt_dna_test",
  "title": "The DNA Request",
  "category": "life:family",
  "stages": ["break", "prime"],
  "trigger": "conditional",
  "characterBias": "low",
  "gates": { "requiresFlag": "parties_hard", "minWeeksSinceFlag": 20 },
  "cooldownWeeks": 999, "seasonCap": 1,
  "prompt": "A woman from that season contacts you. She's requesting a paternity test.",
  "choices": [
    { "label": "Take responsibility, do the test", "effects": { "Rep": -4, "Mor": -6, "flag": ["dna_pending"] }, "reason": "Owning it — reputation dips now, but the honest path.", "followups": ["evt_child_confirmed"] },
    { "label": "Deny and lawyer up", "effects": { "Rep": -10, "Prof": -4, "Fin": -6, "flag": ["denied_child"] }, "reason": "The story leaks; image and legal costs hit harder." }
  ]
}
```
```json
{
  "id": "evt_child_confirmed",
  "title": "It's Confirmed",
  "category": "life:family",
  "stages": ["break", "prime"],
  "trigger": "chain",
  "gates": { "requiresFlag": "dna_pending" },
  "prompt": "The test is positive. You're a parent.",
  "choices": [
    { "label": "Step up — support them properly", "effects": { "Fam": 10, "Mor": 4, "obligation": "child_support", "Character": "+" }, "reason": "Recurring support cost begins; family and character rise." },
    { "label": "Pay the minimum, stay distant", "effects": { "Fam": -6, "Rep": -5, "obligation": "child_support_min", "Character": "-" }, "reason": "Cheaper, but it follows your reputation." }
  ]
}
```
Shorthand for the other two seeds:

> **`evt_flash_car` — The Dream Car** · *break, prime* · *life:purchase* · low · `minFinances:30`
> A limited-run supercar is available now — most of a year's wages.
> - **Buy it** → Fin −large, Life +12, Mor +8, Rep +3, flag[big_spender]; *lifestyle upkeep rises, savings gutted.*
> - **Stay sensible** → Prof +4, Fin +2, Mor −2; *discipline over flash.*
> - **Lease a modest one** → Fin −small, Life +4; *a middle path.*

> **`evt_locker_fight` — Flashpoint** · *any* · *career:relationships* · neutral · `—`
> A locker-room row explodes into shoving. It's about to become a fight.
> - **Break it up** → Std +6, Rep +5, Character +, flag[peacemaker]; *leadership noticed.*
> - **Throw a punch** → Std −10, Rep −8, Prof −6, flag[hothead]; *coach and press turn on you.*
> - **Stay out of it** → Mor −2; *neutral, but teammates notice you didn't help.*

> **`evt_betting_deal` — The Shady Sponsor** · *prime, vet* · *life:finance* · low · `characterBand:LooseCannon, minFinancesTrouble`
> A betting outfit offers a big, quiet endorsement — the kind clubs frown on.
> - **Take the money** → Fin +large, Rep −10, Prof −6, flag[betting_ties]; *cash now, exposure later — arms future scandal events.*
> - **Refuse** → Rep +4, Character +; *clean, if poorer.*

---

## 5. Evergreen life events by stage

### Youth (16–18)
> **`evt_first_contract` — First Professional Terms** · *youth* · *career* · neutral
> The club offers your first pro deal — modest, but real.
> - **Sign now** → Fin +2, Mor +8, Std +3; *security and belonging.*
> - **Let your manager push for more** → outcome via agent trust; *risk/reward on the agent.*
> - **Hold out for a rival's interest** → Rep +/−, Std −4; *bold, could backfire.*

> **`evt_school_or_football` — Books or Boots** · *youth* · *life:family* · high · `familyExpectation:high`
> Your family wants you to finish school as a fallback. Training clashes with exams.
> - **Prioritize football** → Rdy +2, Fam −5, flag[all_in]; *committed, family uneasy.*
> - **Balance both** → Rdy −3, Fam +4, Prof +3; *tired but grounded.*

> **`evt_academy_bully` — The Pecking Order** · *youth* · *career:relationships* · neutral
> A senior youth player is making your life hard.
> - **Stand up to him** → Std +4, Rep +2, or backfire; *earns respect or a target.*
> - **Keep your head down** → Prof +2, Mor −3; *survive quietly.*

> **`evt_hometown_hero` — Local Boy** · *youth, break* · *life:reputation* · high · `—`
> Your hometown paper wants to make you their rising star.
> - **Embrace it** → Rep +6, Fam +5, pressure flag; *pride, and expectation.*
> - **Stay low-key** → Prof +3; *no hype, no fall.*

### Breakthrough (18–22)
> **`evt_first_wages` — Real Money** · *break* · *life:finance* · neutral
> Your first proper paycheque clears. It feels unreal.
> - **Bank most of it** → Fin +8, Prof +4, flag[saver]; *future-you says thanks.*
> - **Treat family & friends** → Fin −4, Fam +10, Mor +6; *generous, warm.*
> - **Blow it on a weekend** → Fin −8, Life +10, Mor +5, Prof −4; *fun now.*

> **`evt_agent_poach` — A Flashier Manager** · *break, prime* · *career* · low · `agentTrust:low`
> A big-name agent whispers he could do better for you.
> - **Switch** → agent tier/trust reset, Std +/−; *gamble on a new relationship.*
> - **Stay loyal** → Fam +3, agent trust +; *loyalty compounds.*

> **`evt_media_debut` — First Big Interview** · *break* · *life:media* · neutral
> Live TV wants your first real sit-down.
> - **Play it humble** → Rep +6, Prof +4; *fans warm to you.*
> - **Show swagger** → Rep +/−, Character −, flag[cocky]; *divisive, memorable.*
> - **Fumble it nervously** → Rep −3, Mor −4; *rough, forgivable.*

> **`evt_loyalty_transfer` — First Big Offer** · *break, prime* · *career* · neutral
> A wealthier club comes in. Your current club raised you.
> - **Chase the move** → Fin +, Std −6 (at old club), flag[mercenary]; *ambition over sentiment.*
> - **Stay and repay them** → Rep +8, Fam +4, Character +; *loyalty banked.*

> **`evt_love_interest` — Something Real** · *break, prime* · *life:family* · neutral
> You've met someone who isn't about the fame.
> - **Commit** → Fam +10, Mor +8, flag[partner]; *stability.*
> - **Keep it casual** → Life +4, Fam −3; *freedom, for now.*

### Prime (22–29)
> **`evt_captaincy` — The Armband** · *prime* · *career* · high · `minStanding:regular`
> The coach offers you the captaincy.
> - **Accept** → Std +10, Rep +8, Prof +5, pressure flag; *leader now.*
> - **Decline, lead quietly** → Prof +4, Mor +2; *no spotlight, no burden.*

> **`evt_marriage` — The Wedding** · *prime* · *life:family* · high · `requiresFlag:partner`
> Your partner wants to make it official.
> - **Big wedding** → Fin −large, Fam +14, Mor +10, Rep +4; *joyful, costly.*
> - **Small and private** → Fin −small, Fam +10, Mor +6; *intimate.*
> - **Not yet** → Fam −8, Mor −4; *strain.*

> **`evt_new_baby` — A New Arrival** · *prime, vet* · *life:family* · high · `requiresFlag:partner`
> You're having a child.
> - **Full-on dad mode** → Fam +12, Rdy −6 (sleepless), Mor +8; *tired and glowing.*
> - **Lean on nannies, stay focused** → Fam +2, Prof +4, Rdy −2; *career-first.*

> **`evt_crypto_pitch` — The Sure Thing** · *prime* · *life:finance* · low · `minFinances:40`
> A "friend" pitches a can't-miss investment.
> - **Go in big** → Fin swing (mostly down), flag[bad_investment]; *arms a future money-trouble event.*
> - **Small stake only** → Fin −small; *limited downside.*
> - **Pass** → Prof +3; *disciplined.*

> **`evt_gambling_creep` — One More Bet** · *prime* · *life:lifestyle* · low · `characterBand:!ModelPro`
> The card nights are getting bigger. It's a lot of money now.
> - **Rein it in** → Prof +5, Character +, flag[beat_habit]; *pulled back in time.*
> - **Keep chasing** → Fin −, Mor −, flag[gambling_problem]; *a cautionary spiral begins — consequences compound.*

> **`evt_scandal_leak` — The Video** · *prime* · *life:media* · low · `requiresAnyFlag:[parties_hard, hothead, betting_ties]`
> A private clip is leaking to the press.
> - **Get ahead of it, apologize** → Rep −5, Prof +3; *damage limited.*
> - **Deny everything** → Rep −12, Mor −6; *it gets worse.*

> **`evt_national_call` — The Call-Up** · *prime* · *career* · high · `minStanding:regular`
> Your national side calls you up for the Global National Competition qualifiers.
> - **Answer with pride** → Rep +10, Mor +12, Rdy −4 (travel), Character +; *a career peak.*
> - **Withdraw, protect your body** → Rep −8, Fam +/−; *club-first, fans grumble.*

> **`evt_teammate_dive` — The Dark Arts** · *prime* · *career:relationships* · neutral
> A senior teammate wants you to go down easily to win a penalty.
> - **Refuse on principle** → Character +, Std −2; *clean, slightly awkward.*
> - **Do it, win the game** → Rep −3, Std +3, flag[gamesmanship]; *pragmatic.*

### Veteran (30–33)
> **`evt_mentor_youth` — Passing It On** · *vet* · *career:relationships* · high
> A nervous academy kid reminds you of yourself.
> - **Take him under your wing** → Rep +8, Character +, Std +4, flag[mentor]; *legacy building.*
> - **Focus on your own game** → Prof +2; *time is short.*

> **`evt_coaching_badges` — Life After** · *vet* · *career* · neutral
> You could start coaching badges now, around training.
> - **Enroll** → Rdy −3, flag[coach_track]; *sets up a post-career path.*
> - **Not yet** → Rdy +2; *stay present.*

> **`evt_body_breaking` — The Warning Sign** · *vet, twilight* · *career:health* · neutral · `agePhase:decline`
> The physio flags wear that won't fully heal.
> - **Manage load, play smart** → Rdy +, Prof +4; *extend the career.*
> - **Push through, ignore it** → Rdy −, injuryRisk +, flag[grinding]; *pride over prudence.*

> **`evt_testimonial` — Your Night** · *vet, twilight* · *life:reputation* · high · `minYearsAtClub:5`
> The club offers you a testimonial match.
> - **Host it, give proceeds to charity** → Rep +12, Character +, Fam +6; *beloved.*
> - **Keep the gate money** → Fin +, Rep −2; *practical.*

### Twilight (33–36)
> **`evt_last_contract` — Wind Down or Chase On** · *twilight* · *career* · neutral · `agePhase:decline`
> Offers are drying up. One last decision on where to finish.
> - **Drop down a level to keep playing** → Fin −, Mor +6, Rdy +; *love of the game.*
> - **Chase one more big payday abroad** → Fin +, Fam −6, homesick flag; *money and distance.*
> - **Retire on top** → flag[retired_proud]; *walk away clean.* → `evt_retirement`

> **`evt_retirement` — Hanging Them Up** · *twilight, post* · *career* · neutral
> It's time.
> - **Announce with gratitude** → Rep +10, Mor +/−, flag[retired]; *the end, and a beginning.*
> - **Quietly fade out** → Mor −4; *no fanfare.*

### Post-career (36+)
> **`evt_punditry` — On the Panel** · *post* · *career* · high · `minReputation:50`
> A network wants you as a pundit.
> - **Take it** → Fin +, Rep +, flag[media_career]; *stay in the game.*
> - **Prefer coaching** → requires coach_track; *dugout over studio.*

> **`evt_finances_reckoning` — The Bill Comes Due** · *post* · *life:finance* · neutral · `requiresAnyFlag:[big_spender, bad_investment, gambling_problem]`
> The spending years catch up. The accounts are thin.
> - **Sell up, restructure** → Fin stabilizes, Mor −6; *humbling but survivable.*
> - **Ignore it** → hard-fail risk (broke); *the cautionary ending Savio warned about.*

> **`evt_elder_statesman` — Legacy** · *post* · *life:reputation* · high · `requiresFlag:mentor`
> A player you mentored just made his debut and thanked you on TV.
> - **Savor it** → Mor +14, Character +; *this was the point.*

---

## 6. Universal "far from home" set (all origins)

> **`evt_homesick` — A Long Way From Home** · *break, prime* · *life:morale* · neutral · `homeContinent != locationContinent`
> Different continent, different everything. It's wearing on you.
> - **Fly family over** → Fin −, Fam +10, Mor +10; *worth every penny.*
> - **Immerse in the local culture** → Mor +6, Rep +4, flag[settled]; *you adapt.*
> - **Push through alone** → Mor −6, Prof +2; *tough it out.*

> **`evt_language` — Lost in Translation** · *break, prime* · *career:relationships* · neutral · `foreignLeague`
> You're isolated in the dressing room by the language gap.
> - **Take lessons seriously** → Std +6, Rep +4, flag[integrated]; *doors open.*
> - **Rely on a translator** → Std −3; *you stay on the outside.*

> **`evt_send_money_home` — Family Duty** · *break, prime* · *life:family* · high · `familyExpectation:high`
> Back home, relatives are counting on you now.
> - **Support them generously** → Fin −, Fam +12, Character +; *honoring where you're from.*
> - **Set firm boundaries** → Fin +, Fam −6, Mor −3; *sustainable, but it stings.*

---

## 7. Faith & climate layer (individual-keyed, even-handed)

### 7.1 Ramadan — recurring, observant players (full exemplar)
```json
{
  "id": "evt_ramadan",
  "title": "Ramadan",
  "category": "life:faith",
  "stages": ["youth","break","prime","vet"],
  "trigger": "seasonal",
  "characterBias": "neutral",
  "gates": { "faith": "muslim", "observant": true },
  "recurs": "annual",
  "prompt": "Ramadan begins. You'll be fasting from dawn to sunset — including on match days. How do you approach the month?",
  "choices": [
    { "label": "Observe fully; work with the club nutritionist on timing", "effects": { "Rdy": -6, "Mor": 10, "Fam": 8, "Rep": 4, "Character": "+", "flag": ["observed_ramadan"] }, "reason": "Daytime fasting costs some readiness in fixtures; faith, family and community standing rise. Clubs accommodate with meal timing and breaking fast." },
    { "label": "Observe, but use the traveler/illness allowance for key fixtures", "effects": { "Rdy": -2, "Mor": 4, "Fam": 2 }, "reason": "A recognized accommodation — lighter physical cost, a smaller spiritual/community tradeoff you feel personally." }
  ]
}
```
*Design note: Ramadan is a meaningful observance with a real, documented in-match tradeoff — never framed as a mere "debuff." The player's faith is treated with respect and agency.*

### 7.2 Other faith & pilgrimage
> **`evt_hajj` — The Pilgrimage** · *vet, twilight* · *life:faith* · high · `faith:muslim, observant, age>=32, minFinances:40`
> You feel ready to undertake the Hajj. It means missing preseason.
> - **Go** → Rdy −8 (missed prep), Mor +18, Fam +12, Rep +8, Character +, flag[completed_hajj]; *a life milestone; deep morale and standing.*
> - **Defer a year** → Mor −3; *not yet.*

> **`evt_eid` — Eid Celebration** · *any* · *life:faith* · high · `faith:muslim, observant` · seasonal
> Eid brings family and community together.
> - **Celebrate fully** → Fam +8, Mor +8, Character +; *joy and belonging.*

> **`evt_faith_milestone` — A Quiet Faith** · *prime, vet* · *life:faith* · high · `faith != none`
> Your faith (whatever it is) is steadying you through a hard patch. *(Adapts to the player's faith — church, mosque, temple.)*
> - **Lean into it** → Mor +10, Prof +4, Character +, flag[grounded_faith]; *an anchor.*
> - **Keep it private** → Mor +4; *personal.*

### 7.3 Climate (symmetric — advantage and disadvantage both exist)
> **`evt_heat_struggle` — The Summer Wall** · *any* · *career:health* · neutral · `climateOrigin:temperate|cold, climateNow:hot, season:summer`
> The heat in this league is brutal, and your body isn't built for it.
> - **Commit to a heat-acclimatization block** → time cost, then Rdy + in heat, flag[heat_adapted]; *invest now, thrive later.*
> - **Tough it out** → Rdy − through summer, injuryRisk +; *suffer in the sun.*

> **`evt_heat_advantage` — In Your Element** · *any* · *career* · high · `climateOrigin:hot, climateNow:hot, season:summer`
> While others wilt in the heat, you're barely breaking sweat.
> - **Exploit it** → Rdy +, Std +5, Mor +6; *your conditions, your edge.*

> **`evt_cold_shock` — Frozen Out** · *any* · *career:health* · neutral · `climateOrigin:hot, climateNow:cold, season:winter`
> A hot-country player in a northern winter — the cold bites.
> - **Adapt your prep (warm-ups, kit)** → Rdy +, flag[cold_adapted]; *learn the climate.*
> - **Dread every away trip north** → Mor −4, Rdy −; *it wears you down.*

### 7.4 Cultural / institutional (factual, neutral)
> **`evt_carnival` — Carnival Season** · *any* · *life:lifestyle* · neutral · `origin:brazil` · seasonal
> Carnival is everywhere. The temptation to lose a week to it is real.
> - **Join the celebration** → Mor +10, Life +8, Prof −5, Rdy −6; *joy, at a cost.*
> - **Enjoy it in moderation** → Mor +5, Prof +1; *balanced.*
> - **Stay disciplined** → Prof +5, Mor −3; *eyes on the prize.*

> **`evt_military_service` — The Obligation** · *break, prime* · *career* · neutral · `origin:south_korea, age<28`
> As an eligible South Korean man, mandatory military service is on the horizon — unless a major tournament win earns an exemption.
> - **Target a tournament exemption** → pressure flag, Std +, huge payoff if won; *career-defining stakes.*
> - **Serve now, pause your career** → career pause (time cost), Rdy resets, Rep +4 (respect), Character +; *duty first, football waits.*
> *(Portrayed as a real institution, neutrally.)*

> **`evt_local_hero_pressure` — The Whole Town Watches** · *break, prime* · *life:reputation* · high · `familyExpectation:high, homeContinent:africa|south_america`
> Back home you're proof it can be done. The weight of that is heavy.
> - **Carry it with pride** → Mor +, Rep +8, pressure flag; *inspiring, exhausting.*
> - **Distance yourself to cope** → Mor +2, Rep −4, Fam −4; *self-protection.*

---

## 8. Distribution & pacing (for a 30-year arc)

- **Target mix per season:** ~2–4 authored events surface, competing against the QUIET default (LIFE_SYSTEM engine). Never a wall of prompts — Savio's cap holds.
- **Stage weighting:** temptation/identity events cluster in Break–Prime; legacy/faith/health cluster in Vet–Post. The library should feel *age-appropriate*.
- **Chains create memory:** `parties_hard → dna_test → child_confirmed → child_support`, and `betting_deal / bad_investment / gambling_problem → finances_reckoning → broke`. These long arcs are what make each career feel *authored by the player*.
- **Cultural events are seasoning, not the meal:** at most ~1 culture/faith/climate event active at a time, gated to the individual, so they land as texture rather than a checklist.

---

## 9. Open questions / scaling

1. **Schema reconciliation** — align field names (`characterBias`, `obligation`, `recurs`) with the canonical EVENT_LIBRARY.md before import.
2. **Observance drift** — can `observant` change mid-career (a player becomes more/less devout), and should that be its own event?
3. **Content volume target** — this set (~55 events) proves the pattern; a shippable 30-year arc likely wants 200–400. Want a tagged authoring template so you (or Claude Code) can mass-produce more against this schema?
4. **Exemption/institution accuracy** — confirm how literally to model real institutions (conscription, pilgrimage windows) vs. keep them lightly fictionalized like the clubs and competitions.
5. **Chain visibility** — should the player ever see that a current event traces back to a choice from years ago (a "this began when you…" note), or stay implicit?
