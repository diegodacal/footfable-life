// The Touchline data model. Pure types — no logic, no DOM, no clock.
// Design canon: docs/DESIGN_DECISIONS.md (plan of record) + the reconciled design docs.

// ---------------------------------------------------------------------------
// Attributes & positions
// ---------------------------------------------------------------------------

export type Block = 'technical' | 'physical' | 'mental';

export type AttributeId =
  | 'finishing' | 'passing' | 'control'          // technical
  | 'pace' | 'strength' | 'stamina'              // physical
  | 'composure' | 'positioning';                 // mental

export type Attributes = Record<AttributeId, number>; // 1–20, decimal under the hood

export type Position = 'ST' | 'CM' | 'CB';

export type StatusRung = 'Youth' | 'Backup' | 'Rotation' | 'Regular' | 'Star';

export type Intensity = 'intensive' | 'balanced' | 'recover';

export interface TrainingPlan {
  primary: Block;
  secondary: Block;
  intensity: Intensity;
}

// ---------------------------------------------------------------------------
// The "why" contract
// ---------------------------------------------------------------------------

export interface ReasonFactor {
  label: string;            // plain language, player-facing
  dir: 'up' | 'down' | 'flat';
  weight?: number;          // optional relative magnitude for ordering
}

export interface Reason {
  headline: string;         // one plain-language sentence
  factors: ReasonFactor[];  // the weighted, directional trace
}

// ---------------------------------------------------------------------------
// World: nations, clubs, people
// ---------------------------------------------------------------------------

export type NationId =
  | 'brazil' | 'argentina' | 'spain' | 'france' | 'morocco' | 'south_africa'
  | 'nigeria' | 'japan' | 'china' | 'south_korea' | 'palestine' | 'mexico';

export type Climate = 'hot' | 'temperate' | 'cold';
export type Continent = 'americas' | 'europe' | 'africa' | 'asia';

export interface CulturalProfile {
  origin: NationId;
  climateOrigin: Climate;
  faith: 'muslim' | 'christian' | 'none' | 'other';
  observant: boolean;
  familyExpectation: 'high' | 'normal';
  homeContinent: Continent;
}

export interface Nation {
  id: NationId;
  name: string;
  demonym: string;
  climate: Climate;
  continent: Continent;
  strength: number;          // 0–100 baseline football strength
  leagueName: string;        // fictional
  cupName: string;           // fictional
}

export interface Club {
  id: string;
  nationId: NationId;
  division: 1 | 2;
  name: string;
  short: string;             // 3-letter
  strength: number;          // 0–100; derived from roster for deep tier, rated for light
  budgetTier: number;        // 1–5, drives AI transfer behaviour (M2)
  color: string;             // hex, presentation only
}

/** Lean NPC record — the whole persistent world population uses this shape. */
export interface NpcPlayer {
  id: string;
  name: string;
  nationId: NationId;
  position: Position;
  age: number;
  ability: number;           // 0–100 composite
  potential: number;         // 0–100 hidden ceiling
  form: number;              // rolling avg match rating 0–10
  clubId: string | null;     // null = free agent
  squad: 'senior' | 'youth';
}

// ---------------------------------------------------------------------------
// Competitions & calendar
// ---------------------------------------------------------------------------

export type WeekKind = 'league' | 'cup' | 'rest' | 'preseason' | 'finale';

export interface Fixture {
  week: number;
  homeId: string;
  awayId: string;
  played: boolean;
  homeGoals: number;
  awayGoals: number;
}

export interface TableRow {
  clubId: string;
  played: number; won: number; drawn: number; lost: number;
  gf: number; ga: number; points: number;
}

export interface LeagueSeason {
  nationId: NationId;
  division: 1 | 2;
  fixtures: Fixture[];        // deep league: full list; light leagues: same shape, resolved in aggregate
  table: TableRow[];
}

export interface Calendar {
  weeks: WeekKind[];                    // index 0 = week 1
  windowWeeks: number[];                // transfer window weeks (M2)
  totalWeeks: number;
}

// ---------------------------------------------------------------------------
// Life layer
// ---------------------------------------------------------------------------

export type MeterId = 'professionalism' | 'lifestyle' | 'morale' | 'reputation' | 'finances' | 'family';
export type Meters = Record<MeterId, number>; // 0–100

export type TallyId =
  | 'pro_points' | 'maverick_points' | 'loyalty_points'
  | 'family_points' | 'wealth_points' | 'leader_points';

export interface MeterMove {
  meter: MeterId;
  delta: number;
  reason: Reason;
}

/** One authored life event choice's effects — all optional, all data. */
export interface EventEffects {
  meters?: Partial<Record<MeterId, number>>;
  readiness?: number;
  standing?: number;
  cash?: number;              // in money units (economy maps to €)
  flags?: string[];
  tally?: Partial<Record<TallyId, number>>;
  followupId?: string;        // chains
  reasonText: string;         // player-facing "why" for this choice
}

export interface LifeEventChoice {
  label: string;
  effects: EventEffects;
}

export interface LifeEventDef {
  id: string;
  title: string;
  category: string;                       // e.g. 'life:nightlife'
  stages: CareerStage[];
  weightBase: number;
  characterBias: 'high' | 'neutral' | 'low';
  gates?: EventGates;
  scalesWith?: MeterId[];
  scalesInverse?: MeterId[];
  flagWeightMods?: Record<string, number>;
  cooldownWeeks?: number;
  seasonCap?: number;
  interrupt?: boolean;                    // true = must resolve now; else inbox
  prompt: string;
  choices: LifeEventChoice[];
  isMomentScreen?: boolean;               // staged as a full-screen beat
}

export interface EventGates {
  minMeter?: Partial<Record<MeterId, number>>;
  maxMeter?: Partial<Record<MeterId, number>>;
  requiresFlag?: string[];
  forbidsFlag?: string[];
  tallyAtLeast?: Partial<Record<TallyId, number>>;
  minStatus?: StatusRung;
  matchWithinDays?: number;               // match-eve gate
  minAge?: number;
  maxAge?: number;
  abroad?: boolean;                       // playing outside origin nation (M2)
  faith?: CulturalProfile['faith'];
  familyExpectation?: 'high';
  climateClash?: boolean;                 // origin vs current club climate differ (M2)
}

export type CareerStage = 'youth' | 'break' | 'prime' | 'vet' | 'twilight' | 'post';

export interface FiredEvent {
  eventId: string;
  week: number;
  season: number;
  resolved: boolean;
  choiceIndex?: number;
  reason: Reason;             // why this event fired for YOU, now
}

// ---------------------------------------------------------------------------
// Ambitions — the player-authored goals framework
// ---------------------------------------------------------------------------

export type AmbitionMetric =
  | { kind: 'goals_season'; target: number }
  | { kind: 'rating_season'; target: number }         // avg rating
  | { kind: 'status_reach'; target: StatusRung }
  | { kind: 'starts_season'; target: number }
  | { kind: 'save_cash'; target: number }
  | { kind: 'meter_reach'; meter: MeterId; target: number }
  | { kind: 'win_league' }
  | { kind: 'national_callup' }                        // M3
  | { kind: 'stay_at_club_seasons'; target: number };

export interface AmbitionDef {
  id: string;
  title: string;               // "Prove him wrong — 10 league goals"
  flavor: string;              // one line of fiction
  horizon: 'season' | 'career';
  metric: AmbitionMetric;
  gates?: { minStatus?: StatusRung; maxStatus?: StatusRung; stages?: CareerStage[] };
}

export interface ActiveAmbition {
  defId: string;
  startedSeason: number;
  status: 'active' | 'completed' | 'failed' | 'retired';
  progress: number;            // 0–1 snapshot for display
  verdictReason?: Reason;
}

// ---------------------------------------------------------------------------
// Match
// ---------------------------------------------------------------------------

export type BeatKind =
  | 'kickoff' | 'team_goal' | 'opp_goal' | 'your_goal' | 'your_assist'
  | 'chance' | 'key_pass' | 'tackle' | 'error' | 'save_context'
  | 'sub_on' | 'sub_off' | 'injury' | 'decision' | 'fulltime';

export interface MatchBeat {
  minute: number;
  kind: BeatKind;
  text: string;
  ratingDelta?: number;
  hardStop?: boolean;          // mandatory tap-to-continue (debut, sub-on)
}

export interface MatchDecisionDef {
  id: string;
  prompt: string;
  options: [string, string];
}

export interface PendingMatchDecision {
  def: MatchDecisionDef;
  minute: number;
}

export interface MatchResult {
  fixture: Fixture;
  involvement: 'start' | 'sub' | 'bench' | 'out';
  minutes: number;
  subOnMinute?: number;
  subOffMinute?: number;
  rating: number | null;       // null if didn't play
  goals: number;
  assists: number;
  beats: MatchBeat[];          // ordered, revealed one at a time by the UI
  decision?: { def: MatchDecisionDef; choiceIndex: number; success: boolean; text: string };
  selectionReason: Reason;
}

// ---------------------------------------------------------------------------
// The protagonist & career state
// ---------------------------------------------------------------------------

export interface SeasonStats {
  apps: number; starts: number; minutes: number; goals: number; assists: number;
  ratingSum: number; ratingCount: number;
}

export interface CareerTotals {
  apps: number; goals: number; assists: number; seasons: number;
}

export interface Milestone {
  id: string;
  week: number;
  season: number;
  title: string;
  detail: string;
  kind: 'debut' | 'first_goal' | 'first_assist' | 'status' | 'transfer' | 'trophy'
      | 'life' | 'callup' | 'injury' | 'season' | 'chain' | 'ambition' | 'retirement';
}

export interface You {
  id: string;
  name: string;
  nationId: NationId;
  profile: CulturalProfile;
  position: Position;
  age: number;
  birthWeek: number;                   // week-of-season birthday
  attributes: Attributes;
  potential: Attributes;               // hidden; UI shows only a band
  potentialBand: 'Rotation' | 'Regular' | 'Star';
  form: number;                        // 0–10 rolling
  readiness: number;                   // 0–100
  status: StatusRung;
  standing: number;                    // 0–100 with the current coach
  injuryWeeks: number;                 // 0 = fit
  meters: Meters;
  cash: number;                        // money units
  weeklyWage: number;
  season: SeasonStats;
  career: CareerTotals;
  minutesLog: number[];                // minutes per week, newest last (status window)
}

export interface CoachRequest {
  block: Block;
  reason: Reason;
  weeksLeft: number;
  honored: boolean | null;             // null = undecided
}

export interface CareerState {
  id: string;
  seed: number;
  week: number;                        // 1-based within season
  season: number;                      // 1-based
  phase: 'prologue' | 'senior';
  you: You;
  clubId: string;
  training: TrainingPlan;
  coachRequest: CoachRequest | null;
  flags: Record<string, number>;       // flag -> week set (absolute week count)
  tallies: Record<TallyId, number>;
  eventLog: FiredEvent[];
  inbox: FiredEvent[];                 // unresolved, non-interrupt events
  cooldowns: Record<string, number>;   // eventId -> absolute week eligible again
  seasonFired: Record<string, number>; // eventId -> count this season
  ambitions: ActiveAmbition[];
  milestones: Milestone[];
  world: World;
  calendar: Calendar;
  absoluteWeek: number;                // monotonic across seasons
  endedReason: 'retired' | 'broke' | 'washed_out' | null;
  lastReports: WeekReport[];           // ring buffer (recap source), newest first
}

export interface World {
  nations: Nation[];
  clubs: Club[];
  players: NpcPlayer[];                // whole persistent population
  leagues: LeagueSeason[];             // current season, all 24 leagues
}

export interface Game {
  id: string;
  careers: CareerState[];              // first-class list; length 1 at launch
  activeCareerId: string;
}

// ---------------------------------------------------------------------------
// Week output: report + signals (what deserves attention, and why)
// ---------------------------------------------------------------------------

export interface TrainingReadout {
  lines: string[];                     // "Finishing +0.4 — intensive, primary focus…"
  readinessLine: string;
  reason: Reason;
}

export interface LifeWeek {
  moves: MeterMove[];
  firedEvent: FiredEvent | null;
  ledger: { wage: number; upkeep: number; net: number };
}

export interface WeekReport {
  week: number;
  season: number;
  kind: WeekKind;
  match: MatchResult | null;
  training: TrainingReadout;
  life: LifeWeek;
  statusChange: { from: StatusRung; to: StatusRung; reason: Reason } | null;
  injury: { weeks: number; reason: Reason } | null;
  milestones: Milestone[];
  stakes: string;                      // Narrator's framing for the week
  digest: string;                      // one-line summary (Continue compression)
  seasonComplete: boolean;
  prologueComplete: boolean;
}

/** The engine's answer to "does this week deserve the player's attention?" */
export interface WeekSignal {
  worthStopping: boolean;
  reasons: string[];                   // plain language
}

export interface NextBeat {
  title: string;
  detail: string;
  kind: 'match' | 'decision' | 'event' | 'ambition' | 'window' | 'finale' | 'callup';
}

// ---------------------------------------------------------------------------
// Advancing a week. The engine is pure & deterministic per (seed, week), so an
// interactive week is advanced by CALLING AGAIN with the decision filled in —
// the same moments replay identically up to the decision point. Nothing is
// committed until the result kind is 'done' (temporal honesty at state level).
// ---------------------------------------------------------------------------

export interface WeekDecisions {
  life?: number;                       // choice index for an interrupt event
  match?: number;                      // choice index for an in-match decision
}

export type AdvanceResult =
  | { kind: 'done'; state: CareerState; report: WeekReport }
  | { kind: 'needs-life'; event: LifeEventDef; reason: Reason }
  | { kind: 'needs-match'; decision: MatchDecisionDef; minute: number };

export type Action =
  | { type: 'setTraining'; plan: TrainingPlan }
  | { type: 'resolveCoachRequest'; accept: boolean }
  | { type: 'resolveInboxEvent'; eventId: string; choiceIndex: number }
  | { type: 'setAmbitions'; defIds: string[] };

