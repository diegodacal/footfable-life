# Screen Map

> The overall shape of the game's screens: how you navigate, what each screen is *for*, its key elements and states, and how they connect. A direction-setting reference for design and for the Claude Code build. Tags: **[proto]** exists in the prototype · **[full]** planned for the full game.

---

## Navigation model

Four layers, each with a clear role:

- **Top career bar** — switch between your up-to-five parallel careers (each a different footballer). Always visible in the main shell. **[proto: single slot]**
- **Bottom nav — the five tabs** — the always-available views for the selected career: **Home · Team · League · Player · People**. **[proto]**
- **Flow screens** — take over the whole screen during "Advance week" (matchday, summaries). Linear, no bottom nav, one way forward. **[proto]**
- **Modals** — events, choices, and offers that overlay the current screen and must be resolved before continuing. **[proto: advice, loan]**
- **Meta screens** — sit outside the shell: title, prospect select, season end, retirement.

### Flow at a glance
```
Title ──▶ Prospect select ──▶ HOME (tabbed shell)
                                 │
        ┌── Team · League · Player · People (bottom nav) ──┐
        │                                                  │
      HOME ──[Advance week]──▶ (modal? advice/event/offer) ─┤
        ▲                                                  │
        │                          ┌─ match week ─▶ Matchday (team sheet ▶ feed ▶ result)
        │                          └─ rest week  ─▶ (train)          │
        └──────────── Summary ◀───────────────────────────────────┘
                                 │
                     end of season ─▶ Season end ─▶ next season (HOME)
                                                  └─▶ eventually ─▶ Retirement
```

---

## Meta / onboarding screens

### Title / Start **[proto]**
- **Job:** get the player into a career fast.
- **Elements:** game logo, New career, Continue (resume a save), Career archive.
- **States:** first-time (no saves → only New career + no archive); returning (Continue + archive present).
- **Nav:** New → Prospect select · Continue → Home.

### Prospect select **[proto]**
- **Job:** choose which of three youth players you'll become.
- **Elements:** three prospect cards (name, age, position, attribute preview, potential band).
- **States:** the single choice; optional re-roll **[full]**.
- **Nav:** pick → Home.

### Career archive **[proto]**
- **Job:** the record of your footballers — past and present — and their achievements.
- **Elements:** a list of careers (name, position, final status, apps/goals, honours).
- **States:** empty (first play) vs. populated.
- **Nav:** from Title; tapping a career opens its detail **[full]**.

---

## The five tabs (the core shell)

### HOME — the week hub **[proto]**
- **Job:** the spine — see where you stand this week and advance it.
- **Elements:** week counter + season progress; player header (status ladder, form / readiness / minutes); the three-week schedule window with the playing-chance forecast; training focus (70/30) + intensity; coach requests and life prompts; the **Advance** button.
- **States:** match week vs. rest week; injured (training limited); a pending coach request or life choice; on loan.
- **Nav:** Advance → Matchday or rest resolution → Summary. Bottom nav to other tabs.

### TEAM — your squad **[proto]**
- **Job:** see the club you're fighting for a place in.
- **Elements:** squad list (name, position, **age**, ability, goals, apps, avg), your row highlighted, veterans flagged; club form/record; club identity.
- **States:** normal; on loan (shows the loan club); retiring veterans flagged.
- **Nav:** **[full]** tap a teammate/rival for their profile; link to fixtures.

### LEAGUE — the competition **[proto]**
- **Job:** where your club sits in the race.
- **Elements:** the full table (P W D L GF GA GD Pts), your club highlighted, promotion/relegation zones coloured.
- **States:** early season (few games) vs. late; **[full]** switch between competitions (cups, other countries), fixtures & results, top scorers.
- **Nav:** **[full]** into other divisions/nations and the Global National Competition.

### PLAYER — your profile **[proto]**
- **Job:** the complete picture of who your footballer is right now.
- **Elements:** identity (name, age, **birthday week**, nationality **[full]**, club, status); current ability + potential (stars/band); full attributes; season **and** career stats; form / readiness / fitness; the **six life meters [full]**; a **finances** summary **[full]**; sponsors.
- **States:** youth vs. established; injured; on loan.
- **Nav:** self-contained; **[full]** drill into Finances and Life detail.

### PEOPLE — relationships **[proto]**
- **Job:** manage and read the people shaping your career.
- **Elements:** **agent** (name, trust meter, tier **[full]**, hire/part-ways); **coach** (name, standing, tied to the person); **board**; **teammates/chemistry [full]**; **family/partner [full]**; **sponsors [full]**.
- **States:** with/without an agent (no-agent warning); trust high vs. soured; a coach change resetting standing **[full]**.
- **Nav:** actions open confirm modals (sign/fire agent, sign a sponsor).

---

## Flow screens (take over during Advance)

### Matchday **[proto]**
- **Job:** live your involvement in the match.
- **Sub-flow:** **Team sheet** (in the XI / sub / bench / out / injured, with debut banner) → **Live feed** (scoreboard, the big rating ring, minute-by-minute beats, rare in-match decisions, skip-to-result) → **Result**.
- **States:** starting / sub / not playing (no feed); a high-stakes decision; a debut; an injury.
- **Nav:** Kick off → feed → Continue → Summary. (Skippable.)

### Week / Season summary **[proto]**
- **Job:** land the consequences of the week.
- **Elements:** result + score; your rating vs. the team (MOTM, team avg); development gains; status change; coach note; birthday / injury / debut banners; rest-week variant (training result + readiness).
- **States:** match week vs. rest week; big moments (promotion up the ladder, injury, birthday).
- **Nav:** Continue → Home (or Season end on the final week).

### Season end **[proto: basic]**
- **Job:** close the season and bank it.
- **Elements:** season stats, honours, status reached, growth; the archive entry saved.
- **States:** breakthrough season vs. a quiet/loan one; **[full]** awards, contract/transfer window opening.
- **Nav:** → next season (Home) or new career.

### Retirement / career end **[full]**
- **Job:** send the career off with a legacy.
- **Elements:** career totals, honours, a legacy/legacy-score, an archive entry.
- **Nav:** → Career archive.

---

## Modals (overlay & must resolve)

- **Agent advice** **[proto]** — a recommendation, your choice, then Trust/Distrust.
- **Life event** **[full]** — scandal, paternity claim, family, morale slump… (from the event library).
- **Life choice** **[full]** — celebration tiers, night out, purchases, media, family time.
- **Career offers** — **loan [proto]**, transfer, contract, sponsor **[full]**.
- **Confirm dialogs** — sign/fire agent, accept a deal.

---

## Full-game screens still to place

- **Finances** **[full]** — income, balance, spending, upkeep, agent-tier affordability. (Lives off Player, or its own screen.)
- **National team** **[full]** — call-ups, squad, the Global National Competition.
- **Transfer window** **[full]** — offers, negotiation, comparing clubs.
- **Settings / saves** — save management, options.

---

## Screen design principles (the "direction")

- **One job per screen.** If a screen does two things, split it or make one the clear lead.
- **Player-first framing.** Everything reads as *you*, the footballer — never a manager's dashboard.
- **Progressive disclosure.** Youth players see a simpler surface; depth (meters, finances, transfers) reveals as the career grows. Don't dump everything at once.
- **Mobile-first, thumb-reachable.** Primary action at the bottom; scannable rows; the scoreboard/rating as the hero moment.
- **One visual language.** All screens share the palette, type, and components (see the design-system doc, next) so five careers in one world still feel like one game.
- **The loop is home.** Every flow returns to the week hub; tabs are for reading, Home is for acting.

---

*This is the map, not the pixels. Next: a design-system doc to lock the shared visual language, then we iterate individual screens live in the prototype.*
