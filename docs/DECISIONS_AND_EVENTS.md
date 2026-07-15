# Decisions & Events Catalogue

> A reviewable list of the choices and events the game can put in front of the player, and — crucially — the **dependencies** that decide *when* each one shows up. Companion to PROJECT_INSTRUCTIONS.md. This is both a design checklist and a direct input for the Claude Code build. Mark anything you want to add, cut, or change.

---

## 1. How events work

Every week, the loop may surface one or more decisions drawn from several **channels** (match-day, agent, life, career, coach, sponsors, national team). Events are **authored templates**, not pure randomness. Each template has:

- a **trigger** (when it's eligible — a time, a state, or another event),
- **conditions / dependencies** (what raises or lowers its odds),
- **options** (usually 2–3 clear choices),
- **consequences** (effects that write back to the player's state — which then change what happens next).

A weekly **scheduler** looks at everything eligible, weights it by the player's current state, respects pacing (big life events are rare — a few a season), avoids repeats, and picks what to show. This is what makes two careers feel different.

## 2. The state that drives events (dependency inputs)

Events are gated and weighted by these. They're the "why this, why now."

**On-pitch:** attributes, form, status (Youth→Star), recent minutes, injuries, readiness.
**Career:** club level, contract length/wages, market value, reputation, national-team standing.
**Off-pitch meters (the key ones for life events):**
- **Lifestyle / nightlife** — how much the player goes out and takes risks.
- **Professionalism / discipline** — training habits, punctuality, conduct.
- **Morale / motivation**, **public image / reputation**, **finances**.
**Relationships:** agent (hidden reliability + your trust), coach (standing, tied to the person), board, teammates (chemistry), partner/family status, sponsors.
**History flags:** durable marks from past choices — "has a public scandal," "refused the coach twice," "known party-goer," "loyal one-club player," "injury-prone." These are what create chains.

## 3. Dependencies — how one thing leads to another

The point you raised: events shouldn't appear out of nowhere. Each event's odds = **base rate × modifiers from state**. Some example chains:

- **Nightlife high** → raises odds of: a tabloid scandal, a **paternity claim**, a late-night incident, a dip in professionalism. **Nightlife low** → these are rare or don't fire at all.
- **Refuse the coach's training requests / low coach standing** → raises odds of being benched, frozen out, or loaned; lowers odds of a new contract offer.
- **Good form + high reputation** → raises odds of transfer interest, national call-ups, and sponsor offers; a big-money move raises expectations (and pressure events).
- **Low finances + high nightlife** → raises odds of money trouble and bad-deal advice.
- **Strong partner/family stability** → dampens off-pitch drama; a breakup raises morale-hit events.
- **Distrusted / unreliable agent** → more bad advice, worse deals, fewer good opportunities surfaced.

Consequences write back to state, so a single choice can quietly reshape the next season.

## 4. The catalogue (by channel)

*Format: **Event** — trigger — key dependencies — options → consequences. This is a starting set to expand.*

### A. Match-day (in-match) decisions
- **Take the penalty?** — a penalty is won while you're on the pitch — Composure/Finishing; confidence/form — Take it / Leave it → goal or miss; rating, morale.
- **Shoot or square it?** — a half-chance falls to you — Finishing vs. a better-placed teammate — Shoot / Pass → goal, assist, or wasted chance.
- **Dive into the tackle?** — a 50/50 late on — Positioning/Strength; discipline — Go for it / Stay on your feet → win the ball, or a booking/injury risk.
- **React to a provocation?** — an opponent winds you up — composure; discipline history — Rise above it / Bite back → nothing, or a card and a reputation flag.

### B. Training & development
- **Weekly training focus** — every week — potential headroom; coach requests — pick primary/secondary programs → attribute growth.
- **Training intensity** — every week — readiness; upcoming fixtures — Intensive / Balanced / Recover → growth vs. fatigue vs. injury risk.
- **Coach training request** — periodically — coach standing — Accept / Refuse → standing up (accept) or your own focus at a standing cost (refuse).

### C. Agent advice (career / training / life)  *(built in the POC)*
- **Advice moments** — a few a season, if you have an agent — agent's hidden reliability; the decision at hand — Follow / Go the other way, then **Trust / Distrust** → outcome (good or bad), and your trust mark moves the relationship (which changes how much they help).
- Advice spans training focus, resting, sponsor days, transfer timing, handling the media.
- **Sign / part with an agent** — anytime — none — keep / fire / sign new → no agent = much slower development; a new agent = fresh hidden reliability.

### D. Career & transfers
- **Transfer offer** — form + reputation + status high — club level; contract — Push for it / Stay → new club, minutes, wages, expectations.
- **Loan offer** — young + low minutes + have an agent *(in POC)* — status; minutes — Take the loan / Stay & fight → guaranteed minutes at a smaller club vs. keep fighting.
- **Contract talks** — contract running down; good form — status; board relationship — Sign / Hold out / Run it down → wages, security, or a free-agent gamble.

### E. Off-pitch life
- **A night out invitation** — periodically — nightlife tendency; teammates — Go out / Stay in → morale up but readiness/discipline risk; feeds the nightlife meter.
- **Paternity / relationship claim** — rare — **high nightlife**, no stable partner — Handle privately / Go public / Deny → reputation, finances, morale; a lasting flag.
- **Tabloid scandal** — rare — high nightlife or low discipline — how you respond → reputation, sponsor risk.
- **Family situation** — periodically — family flags — support them / focus on football → morale, focus trade-offs.
- **Media interview** — after notable games — form; public image — Speak / Decline / how you answer → reputation, fan and coach perception.
- **Charity / community request** — periodically — reputation — Do it / Skip → public image.

### F. Coach & club
- **Coach change** — periodically — board, results — (event, not always a choice) → your **standing resets** with the new coach; role may change.
- **Dressing-room issue** — occasional — teammate chemistry; personality — take a side / stay out → chemistry, standing.
- **Board expectation** — after a move or new deal — club ambition — (pressure context) → gates future events.

### G. Sponsors & commercial
- **Sponsor offer** — reputation + profile rising — image; agent — Accept / Decline / negotiate → money, image obligations, distraction risk.
- **Sponsor obligation** — while under a deal — the deal's terms — do the appearance / skip → money vs. focus; skipping risks the deal.

### H. National team
- **Call-up** — strong club form; eligibility — national-team-coach view — Accept (default) → reputation, market value, minutes load, injury/fatigue risk.
- **Tournament selection** — around the Global National Competition — form + standing with national coach → a career-defining stage or being left out.

## 5. Authoring model (for the build)

- Events live as **data** (JSON templates): id, channel, trigger, condition/weight expression, options, and each option's consequence (state writes).
- A **scheduler** runs weekly: gather eligible events → weight by state → respect pacing and cooldowns → surface the chosen one(s); most weeks are quiet.
- Consequences write to the **state/flags** in §2, so chains emerge without being hard-scripted.
- Keep big life events **rare and weighty**; keep routine choices (training) frequent but light — the pacing balance from the design pillars.

## 6. In the POC vs. for Claude Code

**Working in the POC now:** match-day decisions, agent advice (5 templates) with the trust loop, the loan offer, and coach training requests.

**For the Claude Code build:** the full event **scheduler + data-driven templates**, the complete **state/flags model** and **dependency weighting**, the off-pitch **life events** (nightlife, relationships, scandals, media, family), **national team** and **multi-league/country** context, and **animated key moments**. These need real architecture (persistence, a data layer, performance) that the single-file mockup shouldn't carry.

---

*Add, cut, or re-weight anything here. Each entry is a template we (or Claude Code) can expand — the catalogue is meant to grow.*
