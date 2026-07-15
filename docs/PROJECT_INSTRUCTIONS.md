# Project Instructions — Football Career RPG (working title)

> A living design brief and collaboration guide. Defines what we're building, the principles behind it, decisions made, decisions still open, and how we'll work. Update it as decisions get made — it's the single source of truth for the project.

---

## 1. The Pitch

A single-player, first-person football (soccer) **career RPG** set in an entirely **fictional world**. You *are* the footballer. You steer your career from youth through prime, decline, and retirement — not by playing matches on the pitch, but by shaping everything around them: how you **train**, the **life** you build off the field, the **clubs** you move between, and the people who shape your fate — chiefly your **manager** (agent) and your **coach**.

The tone is **realistic but dramatized**: grounded in how real football careers work, but with room for **scandals, feuds, and soap-opera arcs**. The heart of the game is development under pressure — a gifted player who trains poorly, listens to the wrong manager, or loses the coach's favor can stall, while discipline and smart relationships can carry a modest talent further than expected.

## 2. Who You Are — DECIDED

You are the **footballer**. First-person career. Matches are **simulated and watched**, not controlled — the focus is the career and life around the game, not on-pitch action.

## 3. Scope, World & Fiction — DECIDED

- You run up to **five parallel careers** as individual footballers.
- They all live in **one shared, persistent world**. The world lives on its own: your footballers and NPCs alike **age, suffer injuries, decline, and retire**, while clubs and coaches change over time. Because it's shared, your own footballers **may** cross paths — as teammates, rivals, or transfer targets — but this is emergent, **never forced**.
- Full career arc per footballer: **youth prospect → first-team breakthrough → prime → decline → retirement**.
- **World structure (target):** **12 real countries**, each with a **top division and a second division of 12 clubs each** (24 clubs per country, ~288 clubs total; the second tier supports loans and relegation), plus **48 national teams** for the Global National Competition. Your footballer's **nationality is one of the 12**.
- **The 12 countries:** Brazil, Argentina, Spain, France, Morocco, South Africa, Nigeria, Japan, China, South Korea, Palestine, Mexico. (Chosen for continental balance and strong football cultures; adjustable.)
- **Three tiers of simulation** keep the world big but cheap: **deep** (your current club and positional rivals — real squads that develop, age, and retire), **light** (every other club in the 12 leagues — a strength rating and abstracted squad, enough for tables, opponents, and transfers), and **shell** (the **36** non-playable nations — a name and strength rating, appearing only in the Global National Competition).
- **Fiction & naming:** the **12 nations are real countries**, but **clubs, competitions, and players are fictional/invented** (which also sidesteps licensing). The international tournament is the **Global National Competition** (the "World Cup" analog); the league and cup names for each country are invented and **TBD**.
- **Depth first:** the prototype starts with **one** footballer and one satisfying weekly loop (the wider world is a full-game target, not part of the slice).

## 4. Design Priorities (your ranking)

1. **Player development & training** — the core loop.
2. **Off-pitch life management** — the strong second pillar.
3. **Career / transfer strategy.**
4. **Emergent drama & stories** — welcome, but a flavor layer rather than the main course.

Build and polish in roughly this order.

## 5. The Core Loop & Interaction Model — DECIDED

**Weekly ticks.** Time advances one week at a time. Each week may surface decisions across several areas — **life, pre-match, post-match, career** — but **not all of them every week**, and some weeks may ask nothing at all. Pacing is an explicit design goal: enough decisions to stay engaged, few enough to avoid fatigue.

**The calendar mixes match weeks and rest weeks** (a break every few weeks). Every week you set a **training focus** (70/30 split) and a **training intensity** — *Intensive / Balanced / Recover*. Intensity is a real trade-off: on a **match week**, pushing Intensive risks injury and leaves you tired and less sharp for the game; on a **rest week** it's mostly upside (bigger gains) but still eats recovery, so you enter the next match less rested. Recover restores Readiness before a big game. **Injuries** are a gentle consequence — a knock sidelines you briefly. A **three-week window** (last / this / next) shows results and a **playing-chance forecast** for the coming fixture.

**Switching between careers.** Your up-to-five footballers are selectable from a **bar at the top** — tap a player to take control of them. You move freely between them week to week.

**Auto-resolution.** You never *have* to decide. If you don't act for a given footballer in a given week, the system **auto-decides** on their behalf and the consequences land like any other. This keeps five parallel careers manageable and makes neglect a meaningful (sometimes costly) choice rather than a chore.

> **Launch scope (build):** the first playable ships **one career**. The engine still models Career as a first-class entity inside a `Game` that holds a **list** of careers (length 1 for now), and the multi-career **auto-resolution loop** is implemented and tested but left unused — so switching between several careers later is a UI + session-loop change, never an engine rewrite. The top career-switching bar is deferred.

**Career arc — youth to first team.**
- **Creation:** you choose your footballer from **three youth prospects**.
- **Youth division:** they begin in a club's youth setup with **simpler football decisions** and lower stakes — a gentle on-ramp.
- **The call-up:** the real career begins when they're promoted toward the first team. Call-ups are **not guaranteed or weekly** — a young player may be an unused squad member, a substitute, or left in the youth side. Earning and holding a first-team place is itself an early goal.

## 6. Core Systems

**Player development & training (priority 1) — DESIGNED.**
- **Attributes — a lean set of 8, outfield only** (goalkeepers deferred, §9):
  - *Technical:* **Finishing** (converting chances), **Passing** (distribution & creativity), **Control** (first touch, dribbling, holding the ball).
  - *Physical:* **Pace** (speed & acceleration), **Strength** (duels, holding players off), **Stamina** (fitness across a match and calendar).
  - *Mental:* **Composure** (decisions & nerve under pressure), **Positioning** (reading the game, attacking and defending).
- **Positions weight these differently** for match performance, so the same eight produce distinct player types (striker leans Finishing/Pace/Composure; centre-back Strength/Positioning/Pace; playmaker Passing/Control/Composure).
- **Potential** is shown only as a **hint or range**, never an exact ceiling. **Position is chosen at youth and locked** for the career.
- **Weekly training = split focus across two of the three programs** (Technical / Physical / Mental), weighted roughly **70/30** — a primary and a secondary each week. Focusing a program raises all of its attributes a little; the primary gains more than the secondary.
- **Coach requests:** the coach may ask that a program take the **primary** slot. **Comply** for a small development bonus and standing; **refuse** to set your own priorities at a standing cost.
- **Two development sources:** attributes grow from **both training and match minutes**. Real playing time — especially against stronger opposition — develops you alongside training. So in the youth phase (few minutes) training leads, and breaking into the first team accelerates growth — creating a real trade-off between a **prestige club** and one where you'd **actually play**.
- **Growth curve (gentle):** gains are modified by **age** (youth fastest; prime slows; physical attributes later decline while mental ones hold or rise), **potential headroom** (diminishing returns near the hidden ceiling), and **coaching/facilities** (a multiplier). **Fatigue** builds slowly and eases with lighter weeks; overtraining is possible but rarely punishing.

**Status & selection — youth to first team — DESIGNED.**
- A career climbs (and can slip down) a named ladder: **Youth → Backup → Rotation → Regular → Star**. Each rung gates your minutes and opportunities.
- **Youth** is the academy stage — training-led development, youth matches, a gentle on-ramp. Impress to earn a call-up.
- Movement up the ladder is driven by your **ability relative to the squad**, **form**, and **age**; you can also drop back after poor form, injury, or new signings.
- **Weekly selection is mostly merit:** the coach picks **start / substitute / benched / left out** chiefly on **ability + form** versus your positional rivals, with fitness, rotation, and fixture congestion as practical modifiers and standing only a minor factor. Playing well is the reliable route to minutes.
- **Loans:** when you're a Youth or Backup player short of minutes, your **manager can arrange a loan** to a smaller club where you'd actually play — trading level and prestige for real minutes and faster development, then returning to your parent club.
- **Hard-fail path:** stall at the bottom rungs and you can be released, drop divisions, or wash out of the game entirely.

**Off-pitch life (priority 2).** Lifestyle and discipline, relationships, media and public image, finances and sponsorships, and how you handle setbacks and temptation. The layer runs on **six 0–100 life meters** — **Professionalism, Lifestyle, Morale, Reputation, Finances, Family** — that feed each other and couple two ways with the on-pitch game (Morale → form, Professionalism → development, Reputation → transfers and sponsors; fame and money raise temptation). These meters also **weight which life events fire** (e.g. a paternity claim is likely at high Lifestyle + low Family, near-impossible otherwise). **Life decisions are few per season** — rare and weighty — with room for scandal and drama. Full spec in **LIFE_SYSTEM.md**; events and dependencies in **DECISIONS_AND_EVENTS.md**.

**Career & transfers (priority 3).** Contracts, wages, transfers, and loans; playing time and competition level; form, reputation, and market value; national-team call-ups. Most transfer legwork flows through your manager.

**Relationship systems.** The living web of people around you (see §7). Notable mechanics:
- **Manager trust:** the manager has **hidden reliability/competence traits** the player never sees, which quietly bias their advice and outcomes. The player **learns** how trustworthy a manager is **over time**, and can **mark each recommendation trust or distrust** as feedback — shaping the relationship and tracking the manager's record.
- **Influence / standing:** a **visible resource** the player grows and spends through decisions, used to sway the coach and board.

**Match presentation — DESIGNED.** You don't manage the team; you live the match through your footballer. The engine resolves the team result *and* your individual contribution in one pass, then plays it back.
- **The feed:** your player's moments with **light team context** — a fast-advancing timeline of your touches, chances, and key involvements, with the score and major team events around them. A live **1–10 rating** ticks as it plays.
- **Flow:** **watch fast, skip to the result anytime**; auto-resolution covers matches you don't engage with (and your other careers).
- **Performance model:** position-weighted attributes + form + role/minutes + opposition strength + variance → a 1–10 rating plus concrete events (goal, assist, key pass, tackle, error).
- **In-match decisions:** only **rare, high-stakes moments** (take the penalty, a red-card risk, a late chance, a provocation), resolved through the relevant attribute with real risk and reward.
- **Minutes come from the coach** based on form, fitness, and standing — start, substitute, or unused (links to youth progression).
- **A match feeds:** development (minutes + performance), form, standing, the coach's trust, media/fan mood, and market value.

**Money.** **Important but not central** — but it constrains real choices (see LIFE_SYSTEM.md). Income is a **wage** (club × status × contract) plus **sponsor** money; a **balance** rises with income and falls with spending and the **upkeep** of what you buy; the **Finances meter** reads your security. Two rules give it teeth: you **can't hire beyond your means** (agents come in cost **tiers** — Local/Established/Elite — with visible reach but hidden reliability, so you grow into better-connected ones), and you **can overspend** on parties and purchases — never blocked, but splurging past your means causes debt, a Morale hit, and money-trouble events.

**Progression, goals & endings.**
- **No imposed win condition.** You decide what to chase — money, trophies, national-team caps, legacy — and may pursue **different aims for each footballer**.
- Careers can **hard-fail**: washing out of football, a career-ending injury, or never breaking out of the youth side are all possible.
- A persistent **Career Archive** holds the **history and achievements** of all your footballers, past and present.

## 7. The Cast — Roles & Relationships

You are the **only true agent** in the game. Every other role is an NPC whose behavior reacts to your attributes, form, conduct, choices, and standing. The cast splits into four spheres: **people who work for you**, **people with power over you**, **your peers**, and **your public and personal world**. Two separate "fire/hire" powers exist and belong to different parties — see the note at the end.

### The Footballer — You
The protagonist and sole point of agency. First-person career; matches are simulated. Everyone below relates to you as the hub: you rarely command them, you *influence* them.

### People who work for you

**The Manager (your agent)**
- **Function:** sources clubs, negotiates transfers and contracts, sets career direction, and advises on life situations — advice that may be sound *or* misguided.
- **To you:** an employer/employee bond — you pay a cut and can **hire or fire them**. Having an agent is a **real choice with a cost**: you *can* go without one, but development is much slower and no one is advancing your career, so you have to decide. **Trust is learned over time**: the manager carries **hidden reliability traits** (invisible to you) that bias their advice and its outcomes. You can **mark each recommendation trust/distrust** as feedback.
- **To others:** negotiates with the **board** over your contracts and transfers; often brokers **sponsor** deals; may lobby a coach or club but holds no authority over them.
- **Levers:** competence, honesty, connections, cost, loyalty (mostly hidden).

### People with power over you

**The Coach (the club's head coach)**
- **Function:** controls selection, minutes, your tactical role, and club training emphasis; **may request a specific training focus** from you; may comment on you publicly.
- **To you:** authority over your playing time. The relationship warms or cools with your **influence/standing**, form, conduct, and whether you honor or refuse their training requests; at high standing you can **sway** their decisions. **Standing is tied to the individual coach** — if they leave for another club, you start fresh with their replacement (and could even reunite with a coach who rates you at a new club).
- **To others:** employed by the **board**, who can hire or fire them — a coach change reshuffles your standing and role. Feels pressure from the **fans**.
- **Levers:** tactical preferences, man-management style, temperament, job security.

**Club Management / The Board**
- **Function:** runs the club — budgets, wages, transfer approvals, coach hiring and firing, and overall ambition.
- **To you:** sets your contract and wage; their ambition defines your platform. At high standing you can **influence** their decisions — signings, your role, whether a coach stays or goes.
- **To others:** employs and dismisses the **coach**; negotiates with your **manager**; strikes club-level **sponsor** deals; answers to the **fans**.
- **Levers:** ambition, finances, patience, loyalty (to players vs. coach).

**The National-Team Coach**
- **Function:** a second, parallel selection authority — controls call-ups, international minutes, and your role for your country, culminating in the **Global National Competition**.
- **To you:** independent of your club. Call-ups raise reputation, market value, and pride, but add fixture load and injury/fatigue risk; being frozen out stings and costs standing.
- **To others:** unconnected to your club's board or coach, though club form drives selection; the **media** amplify international performances heavily.
- **Levers:** tactical preferences, loyalty to established internationals, your form and reputation, eligibility.

### Your peers

**Teammates & Rivals**
- **Function:** the players around you — at your club, in your position, and across the league.
- **To you:** locker-room **chemistry** shifts morale and output; positional **rivals** compete for your spot and the coach's favor; rivals elsewhere are benchmarks and story hooks. Your own footballers may cross paths here (never forced).
- **To others:** shape **coach** selection, feed **media** narratives, and colour the dressing-room mood the **board** watches.
- **Levers:** chemistry, competition for position, personality fit, relative form.

### Your public and personal world

**Family & Partner**
- **Function:** the off-pitch anchor — support and stability, or distraction and obligation. Source of major life events.
- **To you:** shapes morale, focus, and stability; creates time-and-attention trade-offs against training and career.
- **To others:** mostly indirect, but personal choices become **media** fodder and trigger **manager** advice moments.
- **Levers:** relationship health, life-stage events, competing demands.

**Fans / Supporters**
- **Function:** the club's supporters — a collective mood that rewards or punishes you.
- **To you:** adoration or hostility drives morale, confidence, and pressure. A fan-favorite earns leeway; a scapegoat feels the heat.
- **To others:** pressure the **board** and **coach** (support or protest can help decide a coach's fate), amplified by and amplifying the **media**.
- **Levers:** form, effort and attitude, loyalty, big moments, conduct.

**Media & Press**
- **Function:** shapes your public image and the narrative around you; applies pressure; amplifies triumphs and scandals alike.
- **To you:** drives reputation, morale, and fan perception; interviews and public conduct are risk/reward choices.
- **To others:** a conduit touching everyone — transfer rumors, coach and board comments, rival feuds, sponsor image, personal life. Turns the private public and fuels the drama.
- **Levers:** your image, how you handle the press, scandal exposure.

**Sponsors & Commercial**
- **Function:** income and prestige in exchange for image obligations and expectations of good conduct.
- **To you:** money and status vs. obligations, time, and image constraints; scandals or poor form can cost deals.
- **To others:** usually brokered by your **manager**; tied to your **media** image; scale up at bigger clubs and with international profile.
- **Levers:** marketability, conduct.

### Who can hire or fire whom (important)
- **You** hire and fire your **manager (agent)** directly.
- The **board** hires and fires the **coach** — you don't, but at high standing your **influence** (and the **fans'** mood) can pressure that outcome.
- This is where the original "may or may not fire or hire" idea lives — split across parties, one you control and one you can only influence.

### Relationship map (at a glance)
- **You → Manager:** employ, trust or distrust, hire/fire.
- **Manager → Board:** negotiates your contracts and transfers.
- **Manager → Sponsors:** brokers your commercial deals.
- **Board → Coach:** hires and fires; sets the coach's mandate.
- **Coach → You:** selects you, sets your role, requests training focus.
- **National-team coach → You:** call-ups toward the Global National Competition.
- **Teammates/Rivals → You & Coach:** chemistry and competition for your spot.
- **Fans → Board & Coach:** pressure that can help decide a coach's fate.
- **You → Coach & Board:** influence/standing lets you sway their decisions.
- **Media → Everyone:** amplifies, exposes, and dramatizes.

## 8. Design Pillars

- **Emergent stories over spreadsheets** — systems should generate narratives.
- **Meaningful trade-offs** — every gain has a cost; no obviously-correct choice.
- **Readable systems** — the player understands *why* something happened.
- **Balanced pacing** — enough to decide to stay engaged, never so much it becomes a chore.
- **Your own goals** — the game imposes no single win condition; you decide what success means, per footballer.
- **Replayability** — different footballers, clubs, managers, and choices yield different arcs.

## 9. Open Topics — Still to Define

### A. Structural decisions
1. **Tech stack** — **parked for now** at your request; the graphical prototype (§10) leans toward a web app. Revisit before Phase 2.

### B. Systems to design in depth (direction noted where set)
- **Attribute model** — RESOLVED (§6): 8 outfield attributes across 3 programs. Remaining: the exact **position-weighting maps** used in match performance.
- **Training loop (priority 1)** — RESOLVED (§6): split 70/30 focus, dual growth from training + minutes, gentle curve, coach requests. Remaining is **numeric tuning** only: growth/decline rates, how match-minute growth scales with level, fatigue values, and whether the 70/30 split is adjustable.
- **Match presentation** — RESOLVED (§6): first-person feed of your moments + team context, 1–10 rating, watch-fast/skip, rare high-stakes decisions. Remaining: the exact performance formula, which high-stakes decisions exist, and the position-weighting maps (shared with the attribute model).
- **Weekly decision pacing** — DIRECTION set (§5): match weeks + rest weeks every few weeks, training focus + intensity each week, a three-week window with a playing-chance forecast. Still to balance the mix of life/pre/post-match prompts.
- **Injuries & fatigue** — DIRECTION set: Readiness driven by training intensity + match load; Intensive risks injury (higher on match weeks); knocks sideline you briefly; plus rare career-ending injuries. Numbers to tune.
- **Auto-resolution logic** — how the system decides for undecided footballers, and how forgiving those defaults are.
- **Youth-to-first-team progression** — RESOLVED (§6): named status ladder (Youth→Backup→Rotation→Regular→Star), merit-based weekly selection, and youth loans for minutes. Remaining: tuning the promotion/selection thresholds and how loans are sourced.
- **Life-events & drama** — designed (LIFE_SYSTEM.md): six meters + a layer-2 dependency engine + layer-3 choices, with a **v1 event/choice library authored in EVENT_LIBRARY.md**. Remaining: expand the library, add tournament/retirement events, and tune.
- **Manager trust & advice** — RESOLVED (§7): hidden reliability; the agent advises on the whole career (transfers, training, life); the player judges purely via their own **trust/distrust marks** (no objective scoreboard); distrust both **sours the relationship** (a distrusted agent helps development less, sliding toward the no-agent penalty) and signals when to fire and re-sign (fresh hidden reliability). Remaining: tuning advice frequency and effect sizes.
- **Influence / standing** — direction: a visible resource. Still to spec how it's earned, spent, and what it unlocks.
- **Economy** — DIRECTION set (LIFE_SYSTEM.md): wage + sponsor income, a balance with upkeep, a Finances security meter, hard-gated agent tiers, and soft overspending with consequences. Remaining: the actual wage/sponsor/upkeep/tier numbers (tuning).
- **Progression, goals & endings** — direction: player-authored goals, hard-fail possible, a **Career Archive** of history and achievements. Still to spec each.
- **World & competition structure** — RESOLVED scale (§3): 12 real countries, each 2 divisions of 12 clubs (24/country, ~288 total), 48 national teams (12 real + 36 shells), three simulation tiers. Remaining: the season calendar and competition formats (league round-robin, cups, the Global National Competition format), and the invented names for each country's clubs and competitions.

## 10. Technical Approach (for the build phase with Claude Code)

- **UI:** a **simple graphical** interface (not text/CLI), starting from a lean prototype.
- **Stack: parked** (§9). The graphical choice points toward a web app, but not decided.
- **Data-driven design.** Attributes, age curves, life events, competition data, and role profiles live in config/data files (e.g. JSON), separate from logic — so we can tune without touching code.
- **Modular systems.** Each system in §6 and each role in §7 is an isolated module with clear inputs/outputs, built and tested independently.
- **Tiered world simulation.** Only the **deep** tier (your club + rivals) tracks individual players; the **light** tier (other clubs) runs on strength ratings and abstracted squads; **shell** nations are name + strength. This keeps 12 leagues and 48 national teams affordable (see §3).
- **Prototype-first.** Smallest playable core: one footballer, from youth prospect through a first season — training + life + fast-sim matches on a weekly loop, with control-switching and auto-resolve stubbed in.
- **Version control and tests** from the start; test the simulation and development math especially.

## 11. How We'll Work

- **Phase 1 — Design (here, in conversation):** resolve §9 topics one at a time; keep this document current as the record.
- **Phase 2 — Prototype:** build the minimal playable loop with Claude Code.
- **Phase 3 — Build out:** add systems from §6 in priority order, tuning as we go.
- **Working rules:** design one system at a time; log every decision back into this doc; prefer the simplest version that tests the idea; keep terminology consistent (§12).

## 12. Glossary (keep strictly consistent)

- **Footballer / You** — the protagonist; the only point of player agency.
- **Manager** — the player's **agent**. Career direction, transfers, life advice (may be right or wrong; hidden reliability traits). Hired/fired by the player.
- **Coach** — the **club's** head coach. Controls selection and playing time; may request training focus; won over via influence. Hired/fired by the board.
- **National-team coach** — controls international call-ups and your role toward the Global National Competition; separate from the club coach.
- **Board / Club Management** — the club's ownership and directors. Budgets, wages, transfers, and the coach's job.
- **Global National Competition** — the international national-team tournament (the world's "World Cup" analog). All competition names are fictional.
- **Simulation tiers** — **deep** (your club + rivals, full squads), **light** (other clubs, strength-rated), **shell** (the 36 non-playable nations, name + strength only).
- **Teammates & Rivals** — the players around you; chemistry and competition for your position.
- **Fans / Supporters** — the club's supporters; a collective mood that pressures the club and you.
- **Media** — the press; shapes public image, turns private events public, fuels drama.
- **Sponsors** — commercial partners; income and prestige for image and conduct.
- **Family & Partner** — the personal-life sphere; morale, stability, and life events.
- **Influence / Standing** — a **visible resource** the player spends to sway the coach and board.
- **Trust feedback** — the player's trust/distrust mark on a manager's recommendation.
- **Attribute** — a rated player quality. The set is 8, outfield only: Finishing, Passing, Control, Pace, Strength, Stamina, Composure, Positioning.
- **Current ability / Potential** — present level vs. a hidden ceiling shown only as a **hint or range**.
- **Training program** — one of three broad blocks (Technical / Physical / Mental); each covers 2–3 attributes.
- **Split focus** — the weekly training choice: a primary and a secondary program weighted roughly **70/30**.
- **Development sources** — attributes grow from **both training and match minutes**.
- **Status ladder** — the progression rungs: Youth → Backup → Rotation → Regular → Star; each gates minutes and opportunities.
- **Selection** — the coach's weekly choice of start / sub / benched / left out, decided mostly on merit (ability + form).
- **Loan** — a temporary move (arranged by your manager) to a smaller club for guaranteed minutes and faster development.
- **Form** — short-term performance state.
- **Morale / Motivation** — mental/emotional state affecting output and development.
- **Tick** — one step of simulated time = **one week**.
- **Auto-resolution** — the system deciding for a footballer in a week the player doesn't act on.
- **Hard-fail** — a career that washes out (never breaks through, career-ending injury, etc.).
- **Career Archive** — the persistent history and achievements of all your footballers.
- **Trajectory** — a footballer's development path over their career.
- **Career** — one of up to five parallel footballer playthroughs, all in the shared world.

## 13. Claude's Role in This Project

Act as a game-design collaborator and, later, engineer. Specifically:

- Push back and offer alternatives rather than just agreeing — this is a design partnership.
- Flag assumptions instead of baking them in; when a §9 topic is unresolved, ask rather than guess. Do not invent specifics (attribute lists, competition names) as if decided.
- Keep the cast roles distinct — especially **manager (agent)** vs **coach (club)** — per §7 and §12.
- Keep this document current: when a decision is settled, update the relevant section and move it out of §9.
- Favor clarity and small, testable steps over large speculative builds.

---

*Working title, scope, and all decisions are provisional until confirmed. Rename the project and this file freely.*
