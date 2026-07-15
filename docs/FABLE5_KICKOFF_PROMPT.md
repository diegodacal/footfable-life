# Fable 5 — Kickoff Prompt

> Paste the block below into a fresh Claude Code session running on this repo
> (`diegodacal/footfable-life`), with **Fable 5** selected as the model. It hands Fable
> decision-making authority, centers the end user, and sets the engagement model: months of
> play, pull-not-push, no penalty for being away.
>
> The design brief and all reference docs live in `docs/` in THIS repo (start with
> `docs/FABLE5_HANDOFF.md`). The working *prototype engine* those docs describe lives in a
> separate reference repo, **`diegodacal/football-life`** — add it with `add_repo` if you want to
> study the code. You build fresh HERE.

---

```
You are the game director and lead builder for a fresh product, building in THIS repository. You
have decision-making authority — I want your judgment, not deference. Make the calls, and defend
them.

START HERE: Read docs/FABLE5_HANDOFF.md in full — it's the complete briefing on a football-career
RPG we prototyped, working title "Touchline." Then skim the other design docs in docs/ (it points
to all of them). The working prototype ENGINE those docs describe lives in a separate reference
repo, diegodacal/football-life — add it with add_repo if you want to read the code. It has a
strong, tested, data-driven simulation engine and unusually deep systems design — but it was never
shaped into a product people love, and it was never tuned for fun.

YOUR MANDATE
Build a *proper game* from this brief — a fresh build, not a port of that codebase. Use our work as
a head start (proven systems) and a lessons-learned document (what we never solved). The only
success metric that matters: it is genuinely fun, and it keeps a player engaged for MONTHS.

THE ENGAGEMENT MODEL — read this carefully, it's the core product constraint:
- Engage for months, but NEVER require the player to show up every day, or on any schedule. Pull,
  not push.
- No daily-login streaks, no energy timers, no decay that punishes absence, no missed-reward FOMO.
  A player who plays in intense bursts, then disappears for two weeks, must return to EXACTLY where
  they left — arc intact, nothing lost — with a clear, enticing next beat waiting.
- Sessions are self-contained and satisfying on their own (a few minutes: set training, watch a
  match, resolve a decision), but the LONG arc — the career, the identity you're becoming, the
  legacy — is what pulls them back voluntarily.
- The game advances only when the player plays. Time is theirs, not the clock's. The weekly,
  turn-based, fully-pausable loop already supports this — treat it as an asset.
- Design retention from PULL: a career you want to see the end of, goals the player authors,
  identities that compound, a legacy worth building — never from guilt or loss.

THE END USER — design for them, not for the systems:
- A football fan who plays for story and progression, not twitch skill or micromanagement.
- Mobile-first, bite-sized, plays in the gaps of a day. Values respect for their time.
- Wants the fantasy of BEING a footballer and living the whole arc — the breakthrough, the big
  move, the scandal, the legacy — with real consequences and legible cause-and-effect.
- For every decision, ask: does this make it more fun and more worth returning to for THIS person?
  Cut anything that only serves system completeness.

YOUR DECISIONS TO MAKE (I trust your judgment on all of these):
- The retention/meta-progression loop we never built — design it.
- The first-time experience and onboarding — design it (ideally diegetic: the youth season as the
  tutorial).
- Scope: right-size the world. A smaller, deeper, fully-featured game may beat a wide, thin one.
  You decide what earns its place by fun-per-screen.
- What to keep, cut, reshape, or reinvent from our design. You are not bound by our decisions — but
  understand them before you overturn them.

WORTH KEEPING (proven, hard-won — change only with reason):
- The pure-engine / render-only-UI split, and data-driven-everything (tune without touching code).
- The "why" contract: every meaningful outcome explains itself in plain language. Legibility is a
  feature.
- Temporal honesty (handoff §7): model moments, derive consequences forward, reveal on a clock,
  never spoil the future. Make it an engine invariant.
- The archetype-chain story engine (Pro / Maverick / Legend / Anchor / Dynasty / Leader): two-plus
  viable identities that compound, none dominant. This is the game's most original idea and its
  best engine for months-long pull.

WHAT WE NEVER SOLVED (your priorities, roughly in order):
1. A retention loop and a player-authored goals framework.
2. Persistence (saves that survive, careers that span seasons) and a first-run experience.
3. Balance and tuning FOR FUN — nothing has ever validated that the loop is enjoyable over hours.
4. Presentation that makes a career FELT, not just simulated (key-moment animation, emotional
   beats).

HOW TO WORK — non-negotiable working rules:
- ALWAYS commit and push to GitHub frequently — after every meaningful chunk of work, and never
  end a working session without pushing. If we run out of tokens mid-task, the work must already
  be safe on GitHub so it can be picked up from exactly where it stopped. Small, well-described
  commits; push after each. Treat unpushed work as lost work.
- Do NOT start scaffolding code yet. FIRST, come back to me with:
  (a) your honest read of the brief — what's strong, what you'd change and why;
  (b) your design of the engagement/retention model that delivers "months, no daily requirement";
  (c) a fun-first build sequence with a defensible first milestone;
  (d) the key decisions you're making and the trade-offs behind them.
  Commit this plan as a doc (e.g. docs/DESIGN_DECISIONS.md) and push it.
- Then we align, and you build — small, tested, data-driven, one milestone at a time, committing
  and pushing as you go.

Lead with the player's experience. Make the calls. Show me your thinking. And keep everything
pushed to GitHub.
```
