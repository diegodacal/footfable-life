# footfable-life

The build home for a fresh football-career RPG, developed by **Fable 5** from the design brief and
lessons of an earlier prototype ("Touchline").

## Start here
1. Open a Claude Code session on this repo with **Fable 5** selected as the model.
2. Paste the kickoff prompt in **`docs/FABLE5_KICKOFF_PROMPT.md`**.
3. Fable reads the full briefing in **`docs/FABLE5_HANDOFF.md`**, proposes a plan, then builds.

## What's in `docs/`
- **FABLE5_HANDOFF.md** — the complete project analysis & briefing. *The entry point.*
- **FABLE5_KICKOFF_PROMPT.md** — the paste-ready prompt that sets Fable's mandate.
- The original design docs (PROJECT_INSTRUCTIONS, PROTOTYPE_SPEC, TRAINING_SYSTEM, LIFE_SYSTEM,
  EVENT_CHAINS, and the rest) — reference material the briefing points into.
- **touchline_prototype.jsx** — the original feel prototype.

## Reference
The working **prototype engine** the briefing describes (pure-TypeScript sim, ~11.4k LOC, 188
tests) lives in a separate reference repo, **`diegodacal/football-life`**. Add it with `add_repo`
in a session to study the code — but this is a **fresh build**, not a port.

## Working rule
Commit and push frequently. Nothing is done until it's on GitHub.
